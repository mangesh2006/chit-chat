import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { s3Client, BUCKET_NAME } from "@/lib/s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET is not configured");
    }

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
    );

    const creatorId = payload.userId;

    if (typeof creatorId !== "string") {
      return NextResponse.json(
        { message: "Invalid authentication token" },
        { status: 401 },
      );
    }

    const formData = await request.formData();

    const nameValue = formData.get("name");
    const memberIdsValue = formData.get("memberIds");
    const avatarFile = formData.get("avatar");

    const name = typeof nameValue === "string" ? nameValue.trim() : "";

    let memberIds: unknown;

    try {
      memberIds =
        typeof memberIdsValue === "string" ? JSON.parse(memberIdsValue) : null;
    } catch {
      return NextResponse.json(
        { message: "Invalid member list" },
        { status: 400 },
      );
    }

    if (
      avatarFile !== null &&
      (!(avatarFile instanceof File) || avatarFile.size > 5 * 1024 * 1024)
    ) {
      return NextResponse.json(
        { message: "Invalid avatar or image exceeds 5 MB" },
        { status: 400 },
      );
    }

    if (!name || name.length > 60) {
      return NextResponse.json(
        { message: "Group name must be between 1 and 60 characters" },
        { status: 400 },
      );
    }

    if (
      !Array.isArray(memberIds) ||
      memberIds.length === 0 ||
      !memberIds.every((id) => typeof id === "string" && id.length > 0)
    ) {
      return NextResponse.json(
        { message: "Select at least one valid group member" },
        { status: 400 },
      );
    }

    const uniqueMemberIds = [...new Set(memberIds as string[])].filter(
      (id) => id !== creatorId,
    );

    if (uniqueMemberIds.length === 0) {
      return NextResponse.json(
        { message: "Select at least one other member" },
        { status: 400 },
      );
    }

    const existingUsers = await prisma.user.findMany({
      where: {
        id: { in: uniqueMemberIds },
      },
      select: { id: true },
    });

    if (existingUsers.length !== uniqueMemberIds.length) {
      return NextResponse.json(
        { message: "One or more selected users do not exist" },
        { status: 400 },
      );
    }

    let avatarKey: string | null = null;

    if (avatarFile) {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

      if (!allowedTypes.includes(avatarFile.type)) {
        return NextResponse.json(
          { message: "Only JPG, PNG, and WebP images are allowed" },
          { status: 400 },
        );
      }

      avatarKey = `group-avatars/${creatorId}/${randomUUID()}`;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: avatarKey,
          Body: Buffer.from(await avatarFile.arrayBuffer()),
          ContentType: avatarFile.type,
        }),
      );
    }

    const conversation = await prisma.conversation.create({
      data: {
        name,
        isGroup: true,
        avatarKey,
        participants: {
          create: [
            {
              userId: creatorId,
              role: "ADMIN",
            },
            ...uniqueMemberIds.map((id) => ({
              userId: id,
              role: "MEMBER",
            })),
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: creatorId,
        content: `created the group "${name}"`,
        type: "SYSTEM",
      },
    });

    const avatarUrl = conversation.avatarKey
      ? await getSignedUrl(
          s3Client,
          new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: conversation.avatarKey,
          }),
          { expiresIn: 3600 },
        )
      : null;

    return NextResponse.json(
      {
        conversation,
        avatarUrl,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("CREATE_GROUP_ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to create group",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
