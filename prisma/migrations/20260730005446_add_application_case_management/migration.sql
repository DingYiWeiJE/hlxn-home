-- CreateEnum
CREATE TYPE "ApplicationCaseLocale" AS ENUM ('zh', 'en');

-- AlterEnum
ALTER TYPE "MediaAssetPurpose" ADD VALUE 'APPLICATION_CASE_IMAGE';

-- CreateTable
CREATE TABLE "ApplicationCase" (
    "id" TEXT NOT NULL,
    "locale" "ApplicationCaseLocale" NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "contentParagraphs" JSONB NOT NULL DEFAULT '[]',
    "caseDate" TIMESTAMP(3) NOT NULL,
    "imageAssetId" TEXT NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ApplicationCase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApplicationCase_locale_caseDate_idx" ON "ApplicationCase"("locale", "caseDate");

-- CreateIndex
CREATE INDEX "ApplicationCase_deletedAt_caseDate_idx" ON "ApplicationCase"("deletedAt", "caseDate");

-- CreateIndex
CREATE INDEX "ApplicationCase_createdAt_idx" ON "ApplicationCase"("createdAt");

-- CreateIndex
CREATE INDEX "ApplicationCase_imageAssetId_idx" ON "ApplicationCase"("imageAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationCase_locale_slug_key" ON "ApplicationCase"("locale", "slug");

-- AddForeignKey
ALTER TABLE "ApplicationCase" ADD CONSTRAINT "ApplicationCase_imageAssetId_fkey" FOREIGN KEY ("imageAssetId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
