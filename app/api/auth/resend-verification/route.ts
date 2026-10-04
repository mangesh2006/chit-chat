import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/mail";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Email is required",
        },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user) {
      return NextResponse.json({
        success: true,
        message:
          "If an account exists with this email, a verification email has been sent.",
      });
    }

    if (user.emailVerified) {
      return NextResponse.json(
        {
          success: false,
          message: "This email is already verified.",
        },
        { status: 400 },
      );
    }

    await prisma.emailVerificationToken.deleteMany({
      where: {
        userId: user.id,
      },
    });

    const verificationToken = crypto.randomBytes(32).toString("hex");

    await prisma.emailVerificationToken.create({
      data: {
        token: verificationToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await sendVerificationEmail({
      email: user.email,
      name: user.name,
      token: verificationToken,
    });

    return NextResponse.json({
      success: true,
      message: "Verification email sent successfully.",
    });
  } catch (error) {
    console.error("RESEND_VERIFICATION_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to send verification email. Please try again later.",
      },
      { status: 500 },
    );
  }
}
