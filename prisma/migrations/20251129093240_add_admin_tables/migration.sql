/*
  Warnings:

  - You are about to drop the column `displayOrder` on the `product_categories` table. All the data in the column will be lost.
  - You are about to drop the column `icon` on the `product_categories` table. All the data in the column will be lost.
  - You are about to drop the column `isFeatured` on the `product_categories` table. All the data in the column will be lost.
  - You are about to drop the column `discount` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `isFeatured` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `isTrending` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `moq` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `reviewCount` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `viewCount` on the `products` table. All the data in the column will be lost.
  - You are about to drop the `enquiries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `product_views` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'ADMIN';

-- DropForeignKey
ALTER TABLE "public"."enquiries" DROP CONSTRAINT "enquiries_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."product_views" DROP CONSTRAINT "product_views_productId_fkey";

-- DropForeignKey
ALTER TABLE "public"."product_views" DROP CONSTRAINT "product_views_userId_fkey";

-- AlterTable
ALTER TABLE "product_categories" DROP COLUMN "displayOrder",
DROP COLUMN "icon",
DROP COLUMN "isFeatured";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "discount",
DROP COLUMN "isFeatured",
DROP COLUMN "isTrending",
DROP COLUMN "moq",
DROP COLUMN "rating",
DROP COLUMN "reviewCount",
DROP COLUMN "tags",
DROP COLUMN "viewCount";

-- DropTable
DROP TABLE "public"."enquiries";

-- DropTable
DROP TABLE "public"."product_views";
