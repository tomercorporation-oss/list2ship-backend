/*
  Warnings:

  - You are about to drop the column `description` on the `quotes` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `quotes` table. All the data in the column will be lost.
  - The `status` column on the `quotes` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `deliveryTime` to the `quotes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `moq` to the `quotes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priceOffer` to the `quotes` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('PENDING', 'SUBMITTED', 'ACCEPTED', 'REJECTED');

-- AlterEnum
ALTER TYPE "RFQStatus" ADD VALUE 'RESPONSES_RECEIVED';

-- DropForeignKey
ALTER TABLE "public"."quotes" DROP CONSTRAINT "quotes_rfqId_fkey";

-- AlterTable
ALTER TABLE "quotes" DROP COLUMN "description",
DROP COLUMN "price",
ADD COLUMN     "additionalNotes" TEXT,
ADD COLUMN     "deliveryTime" TEXT NOT NULL,
ADD COLUMN     "moq" INTEGER NOT NULL,
ADD COLUMN     "priceOffer" DOUBLE PRECISION NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "QuoteStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "rfqs" ADD COLUMN     "attachments" TEXT,
ADD COLUMN     "deliveryLocation" TEXT,
ADD COLUMN     "preferredPrice" DOUBLE PRECISION,
ADD COLUMN     "selectedQuoteId" TEXT,
ADD COLUMN     "timeline" TEXT,
ALTER COLUMN "status" SET DEFAULT 'OPEN';

-- CreateTable
CREATE TABLE "rfq_messages" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "quoteId" TEXT,
    "senderId" TEXT NOT NULL,
    "senderRole" "UserRole" NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rfq_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rfq_messages_rfqId_idx" ON "rfq_messages"("rfqId");

-- CreateIndex
CREATE INDEX "rfq_messages_quoteId_idx" ON "rfq_messages"("quoteId");

-- CreateIndex
CREATE INDEX "quotes_rfqId_idx" ON "quotes"("rfqId");

-- CreateIndex
CREATE INDEX "quotes_sellerId_idx" ON "quotes"("sellerId");

-- CreateIndex
CREATE INDEX "quotes_status_idx" ON "quotes"("status");

-- CreateIndex
CREATE INDEX "rfqs_buyerId_idx" ON "rfqs"("buyerId");

-- CreateIndex
CREATE INDEX "rfqs_status_idx" ON "rfqs"("status");

-- CreateIndex
CREATE INDEX "rfqs_category_idx" ON "rfqs"("category");

-- AddForeignKey
ALTER TABLE "rfqs" ADD CONSTRAINT "rfqs_selectedQuoteId_fkey" FOREIGN KEY ("selectedQuoteId") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "rfqs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_messages" ADD CONSTRAINT "rfq_messages_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "rfqs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_messages" ADD CONSTRAINT "rfq_messages_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
