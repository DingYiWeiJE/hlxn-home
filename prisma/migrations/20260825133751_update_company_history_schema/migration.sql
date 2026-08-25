/*
  Warnings:

  - You are about to drop the `CompanyHistoryItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CompanyHistoryItem" DROP CONSTRAINT "CompanyHistoryItem_imageAssetId_fkey";

-- DropTable
DROP TABLE "CompanyHistoryItem";

-- CreateTable
CREATE TABLE "CompanyHistoryYear" (
    "id" TEXT NOT NULL,
    "locale" "CompanyHistoryLocale" NOT NULL,
    "year" INTEGER NOT NULL,
    "sortDate" TIMESTAMP(3) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CompanyHistoryYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyHistoryEvent" (
    "id" TEXT NOT NULL,
    "historyYearId" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imageAssetId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CompanyHistoryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompanyHistoryYear_locale_sortDate_sortOrder_idx" ON "CompanyHistoryYear"("locale", "sortDate", "sortOrder");

-- CreateIndex
CREATE INDEX "CompanyHistoryYear_deletedAt_idx" ON "CompanyHistoryYear"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyHistoryYear_locale_year_key" ON "CompanyHistoryYear"("locale", "year");

-- CreateIndex
CREATE INDEX "CompanyHistoryEvent_historyYearId_sortOrder_idx" ON "CompanyHistoryEvent"("historyYearId", "sortOrder");

-- CreateIndex
CREATE INDEX "CompanyHistoryEvent_imageAssetId_idx" ON "CompanyHistoryEvent"("imageAssetId");

-- CreateIndex
CREATE INDEX "CompanyHistoryEvent_deletedAt_idx" ON "CompanyHistoryEvent"("deletedAt");

-- AddForeignKey
ALTER TABLE "CompanyHistoryEvent" ADD CONSTRAINT "CompanyHistoryEvent_historyYearId_fkey" FOREIGN KEY ("historyYearId") REFERENCES "CompanyHistoryYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyHistoryEvent" ADD CONSTRAINT "CompanyHistoryEvent_imageAssetId_fkey" FOREIGN KEY ("imageAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
