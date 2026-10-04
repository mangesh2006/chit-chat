import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Verification token is required",
        },
        { status: 400 },
      );
    }

    const verification = await prisma.emailVerificationToken.findUnique({
      where: {
        token,
      },
    });

    if (!verification) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid verification link",
        },
        { status: 400 },
      );
    }

    if (verification.expiresAt < new Date()) {
      await prisma.emailVerificationToken.delete({
        where: {
          id: verification.id,
        },
      });

      return NextResponse.json(
        {
          success: false,
          message: "This verification link has expired.",
        },
        { status: 400 },
      );
    }

    await prisma.$transaction([
      prisma.user.update({
        where: {
          id: verification.userId,
        },
        data: {
          emailVerified: true,
        },
      }),

      prisma.emailVerificationToken.deleteMany({
        where: {
          id: verification.id,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Email verified successfully.",
    });
  } catch (error) {
    console.error("VERIFY_EMAIL_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong.",
      },
      { status: 500 },
    );
  }
}
