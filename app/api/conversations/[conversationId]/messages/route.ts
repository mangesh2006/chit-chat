import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, BUCKET_NAME } from "@/lib/s3";
import { randomUUID } from "crypto";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
  "video/mp4",
  "video/webm",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

async function getAuthenticatedUser(req: Request) {
  const cookie = req.headers.get("cookie");

  const token = cookie
    ?.split(";")
    .find((part) => part.trim().startsWith("token="))
    ?.trim()
    .slice("token=".length);

  if (!token || !process.env.JWT_SECRET) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET),
    );

    return typeof payload.userId === "string" ? payload.userId : null;
  } catch {
    return null;
  }
}

function getAttachmentType(mimeType: string) {
  if (mimeType.startsWith("image/")) return "IMAGE" as const;
  if (mimeType.startsWith("video/")) return "VIDEO" as const;
  return "DOCUMENT" as const;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  try {
    const { conversationId } = await params;
    const userId = await getAuthenticatedUser(req);

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId, userId },
    });

    if (!participant) {
      return NextResponse.json(
        { success: false, message: "Not a participant" },
        { status: 403 },
      );
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        ...(participant.clearedAt
          ? {
              createdAt: {
                gt: participant.clearedAt,
              },
            }
          : {}),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        attachments: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const messagesWithUrls = await Promise.all(
      messages.map(async (message) => ({
        ...message,
        attachments: await Promise.all(
          message.attachments.map(async (attachment) => ({
            ...attachment,
            url: await getSignedUrl(
              s3Client,
              new GetObjectCommand({
                Bucket: BUCKET_NAME,
                Key: attachment.url,
              }),
              { expiresIn: 3600 },
            ),
          })),
        ),
      })),
    );

    return NextResponse.json({
      success: true,
      messages: messagesWithUrls,
    });
  } catch (error) {
    console.error("FETCH_MESSAGES_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  let uploadedKey: string | null = null;

  try {
    const { conversationId } = await params;
    const userId = await getAuthenticatedUser(req);

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId, userId },
    });

    if (!participant) {
      return NextResponse.json(
        { success: false, message: "Not a participant" },
        { status: 403 },
      );
    }

    const formData = await req.formData();
    const contentValue = formData.get("content");
    const fileValue = formData.get("file");

    const content = typeof contentValue === "string" ? contentValue.trim() : "";

    const file =
      fileValue instanceof File && fileValue.size > 0 ? fileValue : null;

    if (!content && !file) {
      return NextResponse.json(
        { success: false, message: "Enter a message or select a file" },
        { status: 400 },
      );
    }

    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, message: "Maximum file size is 25 MB" },
          { status: 413 },
        );
      }

      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        return NextResponse.json(
          { success: false, message: "File type is not supported" },
          { status: 400 },
        );
      }
    }

    let attachmentData:
      | {
          type: "IMAGE" | "VIDEO" | "DOCUMENT";
          url: string;
          name: string;
          size: number;
          mimeType: string;
        }
      | undefined;

    if (file) {
      const safeFileName = file.name
        .replace(/[/\\]/g, "_")
        .replace(/[^\w.-]/g, "_")
        .slice(-150);

      uploadedKey =
        `attachments/${conversationId}/${userId}/` +
        `${randomUUID()}-${safeFileName}`;

      const bytes = Buffer.from(await file.arrayBuffer());

      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: uploadedKey,
          Body: bytes,
          ContentType: file.type,
        }),
      );

      attachmentData = {
        type: getAttachmentType(file.type),
        url: uploadedKey,
        name: file.name,
        size: file.size,
        mimeType: file.type,
      };
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: content || null,
        ...(attachmentData
          ? {
              attachments: {
                create: attachmentData,
              },
            }
          : {}),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        attachments: true,
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    const messageWithUrls = {
      ...message,
      attachments: await Promise.all(
        message.attachments.map(async (attachment) => ({
          ...attachment,
          url: await getSignedUrl(
            s3Client,
            new GetObjectCommand({
              Bucket: BUCKET_NAME,
              Key: attachment.url,
            }),
            { expiresIn: 3600 },
          ),
        })),
      ),
    };

    return NextResponse.json({
      success: true,
      message: messageWithUrls,
    });
  } catch (error) {
    console.error("SEND_MESSAGE_ERROR:", error);

    if (uploadedKey) {
      try {
        const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");

        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: uploadedKey,
          }),
        );
      } catch (cleanupError) {
        console.error("S3_CLEANUP_ERROR:", cleanupError);
      }
    }

    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 },
    );
  }
}
