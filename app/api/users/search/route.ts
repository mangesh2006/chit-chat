import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, BUCKET_NAME } from "@/lib/s3";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim();

    if (!query) {
      return NextResponse.json({
        success: true,
        users: [],
      });
    }

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

    console.log("JWT payload:", payload);

    const userId = payload.userId as string;

    console.log("Logged in userId:", userId);

    const users = await prisma.user.findMany({
      where: {
        id: {
          not: userId,
        },
        OR: [
          {
            username: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            name: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
      },
      take: 10,
    });

    const usersWithAvatarUrls = await Promise.all(
      users.map(
        async (
          user: Prisma.UserGetPayload<{
            select: {
              id: true;
              name: true;
              username: true;
              avatar: true;
            };
          }>,
        ) => {
          const avatarUrl = user.avatar
            ? await getSignedUrl(
                s3Client,
                new GetObjectCommand({
                  Bucket: BUCKET_NAME,
                  Key: user.avatar,
                }),
                { expiresIn: 3600 },
              )
            : null;

          return {
            ...user,
            avatar: avatarUrl,
          };
        },
      ),
    );

    return NextResponse.json({
      success: true,
      users: usersWithAvatarUrls,
    });
  } catch (error) {
    console.error("USER_SEARCH_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 },
    );
  }
}
