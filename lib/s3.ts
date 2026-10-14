import { S3Client } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
});

export const BUCKET_NAME = process.env.AWS_S3_BUCKET!;

if (!BUCKET_NAME) {
  throw new Error("AWS_BUCKET_NAME is missing");
}
