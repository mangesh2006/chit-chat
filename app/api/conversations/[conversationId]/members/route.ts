import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "../messages/route";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  try {
    const { conversationId } = await params;
    const currentUserId = await getAuthenticatedUser(req);

    if (!currentUserId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { userId } = await req.json();

    if (typeof userId !== "string" || !userId) {
      return NextResponse.json(
        { success: false, message: "Valid userId is required" },
        { status: 400 },
      );
    }

    const group = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, isGroup: true },
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
        { success: false, message: "Only admins can add members" },
        { status: 403 },
      );
    }

    const existingMember = await prisma.conversationParticipant.findFirst({
      where: { conversationId, userId },
    });

    if (existingMember) {
      return NextResponse.json(
        { success: false, message: "User is already a member" },
        { status: 409 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    const member = await prisma.conversationParticipant.create({
      data: {
        conversationId,
        userId,
        role: "MEMBER",
      },
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
    });

    return NextResponse.json({
      success: true,
      member: {
        ...member.user,
        role: member.role,
      },
    });
  } catch (error) {
    console.error("ADD_GROUP_MEMBER_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to add member" },
      { status: 500 },
    );
  }
}
