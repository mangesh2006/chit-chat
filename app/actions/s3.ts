"use server";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
});
 
const BUCKET_NAME = process.env.AWS_BUCKET_NAME!;
const allowedTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

async function getCurrentUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token || !process.env.JWT_SECRET) return null;

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET),
    );

    return typeof payload.userId === "string" ? payload.userId : null;
  } catch {
    return null;
  }
}

export async function getSignedURL(contentType: string, size: number) {
  const userId = await getCurrentUserId();

  console.log("S3 config:", {
    region: process.env.AWS_REGION,
    bucket: process.env.AWS_S3_BUCKET,
  });

  if (!userId) {
    return { success: false, message: "Unauthorized" };
  }

  const extension = allowedTypes[contentType];

  if (
    !extension ||
    !Number.isInteger(size) ||
    size <= 0 ||
    size > 5 * 1024 * 1024
  ) {
    return { success: false, message: "Invalid image or file size" };
  }

  try {
    const key = `avatars/${userId}/${randomUUID()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3Client, command, {
      expiresIn: 60,
    });

    return { success: true, url, key, contentType };
  } catch (error) {
    console.error("GET_SIGNED_URL_ERROR:", error);

    return {
      success: false,
      message: "Could not generate upload URL",
    };
  }
}

export async function saveAvatar(key: string) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return { success: false, message: "Unauthorized" };
  }

  if (
    typeof key !== "string" ||
    !key.startsWith(`avatars/${userId}/`) ||
    key.includes("..")
  ) {
    return { success: false, message: "Invalid avatar key" };
  }

  try {
    const { HeadObjectCommand } = await import("@aws-sdk/client-s3");

    const s3Client = new S3Client({
      region: process.env.AWS_REGION!,
    });

    const head = await s3Client.send(
      new HeadObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
      }),
    );

    if (
      !["image/jpeg", "image/png", "image/webp"].includes(
        head.ContentType || "",
      ) ||
      !head.ContentLength ||
      head.ContentLength > 5 * 1024 * 1024
    ) {
      return { success: false, message: "Invalid uploaded image" };
    }

    const previous = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { avatar: key },
    });

    if (
      previous?.avatar?.startsWith(`avatars/${userId}/`) &&
      previous.avatar !== key
    ) {
      const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");

      await s3Client
        .send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME!,
            Key: previous.avatar,
          }),
        )
        .catch((error) => {
          console.error("OLD_AVATAR_DELETE_ERROR:", error);
        });
    }

    return { success: true, key };
  } catch (error) {
    console.error("SAVE_AVATAR_ERROR:", error);

    return { success: false, message: "Could not save avatar" };
  }
}
