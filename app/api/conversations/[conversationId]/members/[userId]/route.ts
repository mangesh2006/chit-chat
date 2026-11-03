import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "../../messages/route";

export async function DELETE(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ conversationId: string; userId: string }>;
  },
) {
  try {
    const { conversationId, userId } = await params;
    const currentUserId = await getAuthenticatedUser(req);

    if (!currentUserId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const group = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { isGroup: true },
    });

    if (!group || !group.isGroup) {
      return NextResponse.json(
        { success: false, message: "Group not found" },
        { status: 404 },
      );
    }

    const admin = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: currentUserId,
        role: "ADMIN",
      },
    });

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Only admins can remove members" },
        { status: 403 },
      );
    }

    const target = await prisma.conversationParticipant.findFirst({
      where: { conversationId, userId },
    });

    if (!target) {
      return NextResponse.json(
        { success: false, message: "Member not found" },
        { status: 404 },
      );
    }

    if (target.role === "ADMIN") {
      const adminCount = await prisma.conversationParticipant.count({
        where: { conversationId, role: "ADMIN" },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          {
            success: false,
            message: "Promote another admin before removing this admin",
          },
          { status: 409 },
        );
      }
    }

    await prisma.conversationParticipant.delete({
      where: { id: target.id },
    });

    return NextResponse.json({ success: true, userId });
  } catch (error) {
    console.error("REMOVE_GROUP_MEMBER_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to remove member" },
      { status: 500 },
    );
  }
}
