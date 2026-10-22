/*
  Warnings:

  - You are about to drop the column `avatar` on the `Conversation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Conversation" DROP COLUMN "avatar",
ADD COLUMN     "avatarKey" TEXT;
