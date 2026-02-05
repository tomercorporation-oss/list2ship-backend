/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `product_categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,parentId]` on the table `product_categories` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."product_categories_name_key";

-- AlterTable
ALTER TABLE "product_categories" ADD COLUMN     "depth" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_slug_key" ON "product_categories"("slug");

-- CreateIndex
CREATE INDEX "product_categories_parentId_idx" ON "product_categories"("parentId");

-- CreateIndex
CREATE INDEX "product_categories_slug_idx" ON "product_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_name_parentId_key" ON "product_categories"("name", "parentId");

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
