-- CreateEnum
CREATE TYPE "MediaAssetPurpose" AS ENUM ('GENERAL', 'PRODUCT_COVER', 'PRODUCT_INTRO_BACKGROUND', 'PRODUCT_ADVANTAGE', 'PRODUCT_APPLICATION', 'NEWS_COVER', 'NEWS_CONTENT');

-- AlterTable
ALTER TABLE "MediaAsset" ADD COLUMN     "purpose" "MediaAssetPurpose" NOT NULL DEFAULT 'GENERAL';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "introBackgroundImageAssetId" TEXT;

-- CreateIndex
CREATE INDEX "MediaAsset_purpose_createdAt_idx" ON "MediaAsset"("purpose", "createdAt");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_introBackgroundImageAssetId_fkey" FOREIGN KEY ("introBackgroundImageAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
