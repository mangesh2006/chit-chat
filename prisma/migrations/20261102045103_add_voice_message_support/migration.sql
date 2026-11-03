-- AlterEnum
ALTER TYPE "AttachmentType" ADD VALUE 'AUDIO';

-- AlterTable
ALTER TABLE "MessageAttachment" ADD COLUMN     "duration" INTEGER;
