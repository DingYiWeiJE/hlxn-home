/*
  Warnings:

  - A unique constraint covering the columns `[slug,locale]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ProductLocale" AS ENUM ('zh', 'en');

-- DropIndex
DROP INDEX "Product_slug_key";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "locale" "ProductLocale" NOT NULL DEFAULT 'zh';

-- CreateIndex
CREATE INDEX "Product_locale_status_sortOrder_idx" ON "Product"("locale", "status", "sortOrder");

-- CreateIndex
CREATE INDEX "Product_locale_secondaryCategoryId_status_sortOrder_idx" ON "Product"("locale", "secondaryCategoryId", "status", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_locale_key" ON "Product"("slug", "locale");
