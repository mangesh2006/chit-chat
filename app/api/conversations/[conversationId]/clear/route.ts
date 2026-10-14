import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  try {
    const token = (await cookies()).get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET!),
    );

    const userId = payload.userId;

    if (typeof userId !== "string") {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
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
        clearedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Chat cleared successfully",
    });
  } catch (error) {
    console.error("CLEAR_CHAT_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to clear chat" },
      { status: 500 },
    );
  }
}
