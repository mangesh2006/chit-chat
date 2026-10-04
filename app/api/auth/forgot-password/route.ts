import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { sendPasswordResetEmail } from "@/lib/mail";

const EMAIL_COOLDOWN = 60;
const IP_LIMIT = 5;
const IP_WINDOW = 15 * 60;

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Email is required.",
        },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const ipKey = `forgot-password:ip:${ip}`;

    const ipAttempts = await redis.incr(ipKey);

    if (ipAttempts === 1) {
      await redis.expire(ipKey, IP_WINDOW);
    }

    if (ipAttempts > IP_LIMIT) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many requests. Please try again later.",
        },
        { status: 429 },
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user) {
      return NextResponse.json({
        success: true,
        message:
          "If an account exists with this email, a password reset link has been sent.",
      });
    }

    const emailKey = `forgot-password:email:${normalizedEmail}`;

    const emailCooldown = await redis.get(emailKey);

    if (emailCooldown) {
      return NextResponse.json(
        {
          success: false,
          message: "Please wait before requesting another reset email.",
        },
        { status: 429 },
      );
    }

    const token = crypto.randomBytes(32).toString("hex");

    const resetKey = `password-reset:${token}`;

    await redis.set(resetKey, user.id, "EX", 900);

    await redis.set(emailKey, "1", "EX", 900);

    await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      token,
    });

    return NextResponse.json({
      success: true,
      message:
        "If an account exists with this email, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("FORGOT_PASSWORD_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to process your request. Please try again later.",
      },
      { status: 500 },
    );
  }
}
