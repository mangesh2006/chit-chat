import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, BUCKET_NAME } from "@/lib/s3";

export async function GET(req: Request) {
  try {
    const token = req.headers
      .get("cookie")
      ?.split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

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

    const userId = payload.userId as string;

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId,
            deletedAt: null,
          },
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
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            content: true,
            createdAt: true,
            senderId: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const result = await Promise.all(
      conversations.map(async (conversation) => {
        const otherParticipant = conversation.participants.find(
          (participant) => participant.userId !== userId,
        );

        const otherUser = otherParticipant?.user;

        const participant = conversation.participants.find(
          (p) => p.userId === userId,
        );

        const lastMessage = await prisma.message.findFirst({
          where: {
            conversationId: conversation.id,
            ...(participant?.clearedAt
              ? { createdAt: { gt: participant.clearedAt } }
              : {}),
          },
          orderBy: {
            createdAt: "desc",
          },
          select: {
            content: true,
            createdAt: true,
            senderId: true,
          },
        });

        const avatarUrl = otherUser?.avatar
          ? await getSignedUrl(
              s3Client,
              new GetObjectCommand({
                Bucket: BUCKET_NAME,
                Key: otherUser.avatar,
              }),
              { expiresIn: 3600 },
            )
          : null;

        return {
          id: conversation.id,
          name: otherUser?.name ?? "Unknown",
          userId: otherUser?.id,
          username: otherUser?.username ?? "",
          avatar: avatarUrl,
          lastMessage: lastMessage?.content ?? "",
          lastMessageTime: lastMessage
            ? new Date(lastMessage.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "",
        };
      }),
    );

    return NextResponse.json({
      success: true,
      conversations: result,
    });
  } catch (error) {
    console.error("FETCH_CONVERSATIONS_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const token = req.headers
      .get("cookie")
      ?.split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

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

    const userId = payload.userId as string;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const { userId: otherUserId } = await req.json();

    if (!otherUserId) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required",
        },
        { status: 400 },
      );
    }

    if (userId === otherUserId) {
      return NextResponse.json(
        {
          success: false,
          message: "You cannot start a conversation with yourself",
        },
        { status: 400 },
      );
    }

    const otherUser = await prisma.user.findUnique({
      where: {
        id: otherUserId,
      },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
      },
    });

    if (!otherUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 },
      );
    }

    const otherUserAvatarUrl = otherUser.avatar
      ? await getSignedUrl(
          s3Client,
          new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: otherUser.avatar,
          }),
          { expiresIn: 3600 },
        )
      : null;

    const existingConversation = await prisma.conversation.findFirst({
      where: {
        participants: {
          every: {
            userId: {
              in: [userId, otherUserId],
            },
          },
        },
        AND: [
          {
            participants: {
              some: {
                userId,
              },
            },
          },
          {
            participants: {
              some: {
                userId: otherUserId,
              },
            },
          },
        ],
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

    if (existingConversation) {
      const otherParticipant = existingConversation.participants.find(
        (participant) => participant.userId !== userId,
      );

      await prisma.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId: existingConversation.id,
            userId,
          },
        },
        data: {
          deletedAt: null,
        },
      });

      return NextResponse.json({
        success: true,
        conversation: {
          id: existingConversation.id,
          name: otherParticipant?.user.name ?? "Unknown",
          userId: otherParticipant?.user.id,
          username: otherParticipant?.user.username ?? "",
          avatar: otherUserAvatarUrl,
        },
        existing: true,
      });
    }

    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [
            {
              userId,
            },
            {
              userId: otherUserId,
            },
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

    const otherParticipant = conversation.participants.find(
      (participant) => participant.userId !== userId,
    );

    return NextResponse.json(
      {
        success: true,
        conversation: {
          id: conversation.id,
          name: otherParticipant?.user.name ?? "Unknown",
          username: otherParticipant?.user.username ?? "",
          avatar: otherParticipant?.user.avatar ?? null,
        },
        existing: false,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("CREATE_CONVERSATION_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 },
    );
  }
}
