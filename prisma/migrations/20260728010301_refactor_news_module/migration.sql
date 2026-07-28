/*
  Warnings:

  - You are about to drop the column `coverImage` on the `News` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[sourceArticleId,locale]` on the table `News` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "NewsSourceType" AS ENUM ('MANUAL', 'WECHAT');

-- AlterTable
ALTER TABLE "News" DROP COLUMN "coverImage",
ADD COLUMN     "coverImageAssetId" TEXT,
ADD COLUMN     "importMeta" JSONB,
ADD COLUMN     "importedAt" TIMESTAMP(3),
ADD COLUMN     "sourceAccountName" TEXT,
ADD COLUMN     "sourceArticleId" TEXT,
ADD COLUMN     "sourcePublishedAt" TIMESTAMP(3),
ADD COLUMN     "sourceType" "NewsSourceType" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "sourceUrl" TEXT;

-- CreateIndex
CREATE INDEX "News_coverImageAssetId_idx" ON "News"("coverImageAssetId");

-- CreateIndex
CREATE INDEX "News_sourceType_idx" ON "News"("sourceType");

-- CreateIndex
CREATE INDEX "News_sourcePublishedAt_idx" ON "News"("sourcePublishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "News_sourceArticleId_locale_key" ON "News"("sourceArticleId", "locale");

-- AddForeignKey
ALTER TABLE "News" ADD CONSTRAINT "News_coverImageAssetId_fkey" FOREIGN KEY ("coverImageAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
