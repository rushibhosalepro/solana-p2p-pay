/*
  Warnings:

  - The values [PENDING,COMPLETED] on the enum `TransactionStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `msg` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `receiverId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `receiverWalletId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `reciversPublicKeys` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `senderId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `senderWalletId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `sendersPublicKeys` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `tokenSymbol` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `txHash` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `tokenBalances` on the `Wallet` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[signature]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `blockTime` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `message` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `signature` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slot` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `walletId` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `balance` to the `Wallet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isActive` to the `Wallet` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('SEND', 'RECEIVE', 'UNKNOWN');

-- AlterEnum
BEGIN;
CREATE TYPE "TransactionStatus_new" AS ENUM ('CONFIRMED', 'FINALIZED', 'FAILED');
ALTER TABLE "public"."Transaction" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Transaction" ALTER COLUMN "status" TYPE "TransactionStatus_new" USING ("status"::text::"TransactionStatus_new");
ALTER TYPE "TransactionStatus" RENAME TO "TransactionStatus_old";
ALTER TYPE "TransactionStatus_new" RENAME TO "TransactionStatus";
DROP TYPE "public"."TransactionStatus_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."Transaction" DROP CONSTRAINT "Transaction_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Transaction" DROP CONSTRAINT "Transaction_receiverWalletId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Transaction" DROP CONSTRAINT "Transaction_senderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Transaction" DROP CONSTRAINT "Transaction_senderWalletId_fkey";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "msg",
DROP COLUMN "receiverId",
DROP COLUMN "receiverWalletId",
DROP COLUMN "reciversPublicKeys",
DROP COLUMN "senderId",
DROP COLUMN "senderWalletId",
DROP COLUMN "sendersPublicKeys",
DROP COLUMN "tokenSymbol",
DROP COLUMN "txHash",
DROP COLUMN "updatedAt",
ADD COLUMN     "blockTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "fee" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "fromAddress" TEXT,
ADD COLUMN     "memo" TEXT,
ADD COLUMN     "message" TEXT NOT NULL,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "signature" TEXT NOT NULL,
ADD COLUMN     "slot" BIGINT NOT NULL,
ADD COLUMN     "toAddress" TEXT,
ADD COLUMN     "type" "TransactionType" NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL,
ADD COLUMN     "walletId" TEXT NOT NULL,
ALTER COLUMN "status" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Wallet" DROP COLUMN "tokenBalances",
ADD COLUMN     "balance" BIGINT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL,
ADD COLUMN     "lastSignature" TEXT,
ADD COLUMN     "lastSyncedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_signature_key" ON "Transaction"("signature");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
