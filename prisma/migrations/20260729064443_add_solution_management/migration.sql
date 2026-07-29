-- CreateEnum
CREATE TYPE "SolutionStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "SolutionLocale" AS ENUM ('zh', 'en');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MediaAssetPurpose" ADD VALUE 'SOLUTION_WORKING_PRINCIPLE_BACKGROUND';
ALTER TYPE "MediaAssetPurpose" ADD VALUE 'SOLUTION_USAGE_SCENARIO';
ALTER TYPE "MediaAssetPurpose" ADD VALUE 'SOLUTION_CUSTOMER_VALUE';

-- CreateTable
CREATE TABLE "Solution" (
    "id" TEXT NOT NULL,
    "locale" "SolutionLocale" NOT NULL DEFAULT 'zh',
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "SolutionStatus" NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "summaryParagraphs" JSONB NOT NULL DEFAULT '[]',
    "highlights" JSONB NOT NULL DEFAULT '[]',
    "workingPrincipleParagraphs" JSONB NOT NULL DEFAULT '[]',
    "workingPrincipleBackgroundAssetId" TEXT,
    "systemCompositionParagraphs" JSONB NOT NULL DEFAULT '[]',
    "translationKey" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Solution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolutionUsageScenario" (
    "id" TEXT NOT NULL,
    "solutionId" TEXT NOT NULL,
    "imageAssetId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SolutionUsageScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolutionCustomerValue" (
    "id" TEXT NOT NULL,
    "solutionId" TEXT NOT NULL,
    "imageAssetId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detailParagraphs" JSONB NOT NULL DEFAULT '[]',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SolutionCustomerValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Solution_translationKey_idx" ON "Solution"("translationKey");

-- CreateIndex
CREATE INDEX "Solution_locale_status_sortOrder_idx" ON "Solution"("locale", "status", "sortOrder");

-- CreateIndex
CREATE INDEX "Solution_status_sortOrder_idx" ON "Solution"("status", "sortOrder");

-- CreateIndex
CREATE INDEX "Solution_workingPrincipleBackgroundAssetId_idx" ON "Solution"("workingPrincipleBackgroundAssetId");

-- CreateIndex
CREATE INDEX "Solution_deletedAt_idx" ON "Solution"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Solution_locale_slug_key" ON "Solution"("locale", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Solution_translationKey_locale_key" ON "Solution"("translationKey", "locale");

-- CreateIndex
CREATE INDEX "SolutionUsageScenario_solutionId_sortOrder_idx" ON "SolutionUsageScenario"("solutionId", "sortOrder");

-- CreateIndex
CREATE INDEX "SolutionUsageScenario_imageAssetId_idx" ON "SolutionUsageScenario"("imageAssetId");

-- CreateIndex
CREATE INDEX "SolutionCustomerValue_solutionId_sortOrder_idx" ON "SolutionCustomerValue"("solutionId", "sortOrder");

-- CreateIndex
CREATE INDEX "SolutionCustomerValue_imageAssetId_idx" ON "SolutionCustomerValue"("imageAssetId");

-- AddForeignKey
ALTER TABLE "Solution" ADD CONSTRAINT "Solution_workingPrincipleBackgroundAssetId_fkey" FOREIGN KEY ("workingPrincipleBackgroundAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolutionUsageScenario" ADD CONSTRAINT "SolutionUsageScenario_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "Solution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolutionUsageScenario" ADD CONSTRAINT "SolutionUsageScenario_imageAssetId_fkey" FOREIGN KEY ("imageAssetId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolutionCustomerValue" ADD CONSTRAINT "SolutionCustomerValue_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "Solution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolutionCustomerValue" ADD CONSTRAINT "SolutionCustomerValue_imageAssetId_fkey" FOREIGN KEY ("imageAssetId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
