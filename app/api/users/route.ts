import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
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

    const userId = payload.userId;

    if (typeof userId !== "string") {
      return NextResponse.json(
        { message: "Invalid authentication token" },
        { status: 401 },
      );
    }

    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
      },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("FETCH_USERS_ERROR:", error);

    return NextResponse.json(
      { message: "Failed to fetch users" },
      { status: 500 },
    );
  }
}
