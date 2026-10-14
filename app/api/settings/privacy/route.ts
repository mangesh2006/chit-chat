import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { showOnlineStatus } = body;

    if (typeof showOnlineStatus !== "boolean") {
      return NextResponse.json(
        { success: false, message: "Invalid privacy setting" },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id?: string;
      userId?: string;
    };

    const userId = decoded.userId ?? decoded.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 },
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { showOnlineStatus },
      select: { id: true, showOnlineStatus: true },
    });

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("UPDATE_PRIVACY_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to update privacy settings" },
      { status: 500 },
    );
  }
}
