import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";

async function getAuthenticatedUser(req: Request) {
  const cookie = req.headers.get("cookie");
  const token = cookie
    ?.split(";")
    .find((part) => part.trim().startsWith("token="))
    ?.trim()
    .slice("token=".length);

  if (!token || !process.env.JWT_SECRET) return null;

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

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  try {
    const userId = await getAuthenticatedUser(req);

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { conversationId } = await params;

    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { success: false, message: "Conversation not found" },
        { status: 404 },
      );
    }

    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Chat deleted successfully",
    });
  } catch (error) {
    console.error("DELETE_CHAT_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to delete chat" },
      { status: 500 },
    );
  }
}
