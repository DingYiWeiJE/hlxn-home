-- CreateEnum
CREATE TYPE "CompanyHistoryLocale" AS ENUM ('zh', 'en');

-- AlterEnum
ALTER TYPE "MediaAssetPurpose" ADD VALUE 'COMPANY_HISTORY_IMAGE';

-- CreateTable
CREATE TABLE "CompanyHistoryItem" (
    "id" TEXT NOT NULL,
    "locale" "CompanyHistoryLocale" NOT NULL,
    "displayTime" TEXT NOT NULL,
    "sortDate" TIMESTAMP(3) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT,
    "detailParagraphs" JSONB NOT NULL DEFAULT '[]',
    "imageAssetId" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyHistoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompanyHistoryItem_locale_sortDate_sortOrder_idx" ON "CompanyHistoryItem"("locale", "sortDate", "sortOrder");

-- CreateIndex
CREATE INDEX "CompanyHistoryItem_createdAt_idx" ON "CompanyHistoryItem"("createdAt");

-- CreateIndex
CREATE INDEX "CompanyHistoryItem_imageAssetId_idx" ON "CompanyHistoryItem"("imageAssetId");

-- AddForeignKey
ALTER TABLE "CompanyHistoryItem" ADD CONSTRAINT "CompanyHistoryItem_imageAssetId_fkey" FOREIGN KEY ("imageAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
