/*
  Warnings:

  - You are about to drop the column `receiverId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `receiverWalletId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `senderId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `senderWalletId` on the `Transaction` table. All the data in the column will be lost.
  - Added the required column `receiverPublicKey` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderPublicKey` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Transaction" DROP CONSTRAINT "Transaction_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Transaction" DROP CONSTRAINT "Transaction_receiverWalletId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Transaction" DROP CONSTRAINT "Transaction_senderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Transaction" DROP CONSTRAINT "Transaction_senderWalletId_fkey";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "receiverId",
DROP COLUMN "receiverWalletId",
DROP COLUMN "senderId",
DROP COLUMN "senderWalletId",
ADD COLUMN     "receiverPublicKey" TEXT NOT NULL,
ADD COLUMN     "senderPublicKey" TEXT NOT NULL;
