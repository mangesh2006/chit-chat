import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const token = req.headers
      .get("cookie")
      ?.split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith("token="))
      ?.slice("token=".length);

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET is not configured");
    }

    const { payload } = await jwtVerify(
      decodeURIComponent(token),
      new TextEncoder().encode(secret),
    );

    if (typeof payload.userId !== "string") {
      return NextResponse.json(
        { success: false, message: "Invalid authentication token" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (name.length < 2 || name.length > 60) {
      return NextResponse.json(
        {
          success: false,
          message: "Name must be between 2 and 60 characters.",
        },
        { status: 400 },
      );
    }

    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: { name },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatar: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "JWTExpired") {
      return NextResponse.json(
        { success: false, message: "Session expired. Please log in again." },
        { status: 401 },
      );
    }

    console.error("PROFILE_UPDATE_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Unable to update profile." },
      { status: 500 },
    );
  }
}
