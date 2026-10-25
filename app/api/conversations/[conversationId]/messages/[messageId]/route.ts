import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "../route";
import { prisma } from "@/lib/prisma";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> },
) {
  try {
    const { id: conversationId, messageId } = await params;
    const userId = await getAuthenticatedUser(req);

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!content) {
      return NextResponse.json(
        { success: false, message: "Message content cannot be empty" },
        { status: 400 },
      );
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { success: false, message: "Message is too long" },
        { status: 400 },
      );
    }

    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { success: false, message: "Not a participant in this conversation" },
        { status: 403 },
      );
    }

    const existingMessage = await prisma.message.findFirst({
      where: {
        id: messageId,
        conversationId,
        senderId: userId,
      },
    });

    if (!existingMessage) {
      return NextResponse.json(
        {
          success: false,
          message: "Message not found or you cannot edit it",
        },
        { status: 404 },
      );
    }

    const updatedMessage = await prisma.message.update({
      where: {
        id: messageId,
      },
      data: {
        content: content.trim(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: updatedMessage,
      },
      { status: 200 },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> },
) {
  try {
    const { id: conversationId, messageId } = await params;

    const userId = await getAuthenticatedUser(request);

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
        { success: false, message: "Conversation not found" },
        { status: 404 },
      );
    }

    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        conversationId,
        senderId: userId,
      },
      include: {
        attachments: true,
      },
    });

    if (!message) {
      return NextResponse.json(
        { success: false, message: "Message not found" },
        { status: 404 },
      );
    }

    if (message.attachments.length > 0) {
      await Promise.all(
        message.attachments.map((attachment) =>
          s3Client.send(
            new DeleteObjectCommand({
              Bucket: process.env.AWS_S3_BUCKET!,
              Key: attachment.url,
            }),
          ),
        ),
      );

      await prisma.messageAttachment.deleteMany({
        where: { messageId: message.id },
      });
    }

    const deletedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { content: "This message was deleted" },
    });

    return NextResponse.json({
      success: true,
      message: deletedMessage,
    });
  } catch (error) {
    console.error("DELETE_MESSAGE_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to delete message" },
      { status: 500 },
    );
  }
}
