-- CreateEnum
CREATE TYPE "CmsBackgroundLocation" AS ENUM ('HOMEPAGE', 'ABOUT_US', 'SOLUTIONS', 'PRODUCTS', 'APPLICATION_CASES', 'NEWS', 'CONTACT_US');

-- CreateEnum
CREATE TYPE "CmsBrochureLanguage" AS ENUM ('zh', 'en');

-- DropForeignKey
ALTER TABLE "SolutionCustomerValue" DROP CONSTRAINT "SolutionCustomerValue_imageAssetId_fkey";

-- DropForeignKey
ALTER TABLE "SolutionUsageScenario" DROP CONSTRAINT "SolutionUsageScenario_imageAssetId_fkey";

-- AlterTable
ALTER TABLE "SolutionCustomerValue" ALTER COLUMN "imageAssetId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SolutionUsageScenario" ALTER COLUMN "imageAssetId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "CmsBackgroundImage" (
    "id" TEXT NOT NULL,
    "location" "CmsBackgroundLocation" NOT NULL,
    "type" TEXT NOT NULL,
    "relativePath" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CmsBackgroundImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CmsBrochure" (
    "id" TEXT NOT NULL,
    "language" "CmsBrochureLanguage" NOT NULL,
    "relativePath" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CmsBrochure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CmsPartner" (
    "id" TEXT NOT NULL,
    "imageRelativePath" TEXT NOT NULL,
    "imageFilename" TEXT NOT NULL,
    "imageMimeType" TEXT NOT NULL,
    "imageSize" INTEGER NOT NULL,
    "websiteUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CmsPartner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CmsContactMethod" (
    "id" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CmsContactMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CmsCompanyAddress" (
    "id" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CmsCompanyAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CmsCompanyHonor" (
    "id" TEXT NOT NULL,
    "imageRelativePath" TEXT NOT NULL,
    "imageFilename" TEXT NOT NULL,
    "imageMimeType" TEXT NOT NULL,
    "imageSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CmsCompanyHonor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CmsWorkshopImage" (
    "id" TEXT NOT NULL,
    "imageRelativePath" TEXT NOT NULL,
    "imageFilename" TEXT NOT NULL,
    "imageMimeType" TEXT NOT NULL,
    "imageSize" INTEGER NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CmsWorkshopImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CmsBackgroundImage_location_key" ON "CmsBackgroundImage"("location");

-- CreateIndex
CREATE UNIQUE INDEX "CmsBackgroundImage_relativePath_key" ON "CmsBackgroundImage"("relativePath");

-- CreateIndex
CREATE INDEX "CmsBackgroundImage_location_idx" ON "CmsBackgroundImage"("location");

-- CreateIndex
CREATE INDEX "CmsBackgroundImage_deletedAt_idx" ON "CmsBackgroundImage"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CmsBrochure_relativePath_key" ON "CmsBrochure"("relativePath");

-- CreateIndex
CREATE INDEX "CmsBrochure_deletedAt_idx" ON "CmsBrochure"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CmsBrochure_language_key" ON "CmsBrochure"("language");

-- CreateIndex
CREATE INDEX "CmsPartner_deletedAt_idx" ON "CmsPartner"("deletedAt");

-- CreateIndex
CREATE INDEX "CmsContactMethod_language_idx" ON "CmsContactMethod"("language");

-- CreateIndex
CREATE INDEX "CmsContactMethod_deletedAt_idx" ON "CmsContactMethod"("deletedAt");

-- CreateIndex
CREATE INDEX "CmsCompanyAddress_deletedAt_idx" ON "CmsCompanyAddress"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CmsCompanyAddress_language_key" ON "CmsCompanyAddress"("language");

-- CreateIndex
CREATE INDEX "CmsCompanyHonor_deletedAt_idx" ON "CmsCompanyHonor"("deletedAt");

-- CreateIndex
CREATE INDEX "CmsWorkshopImage_deletedAt_idx" ON "CmsWorkshopImage"("deletedAt");

-- AddForeignKey
ALTER TABLE "SolutionUsageScenario" ADD CONSTRAINT "SolutionUsageScenario_imageAssetId_fkey" FOREIGN KEY ("imageAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolutionCustomerValue" ADD CONSTRAINT "SolutionCustomerValue_imageAssetId_fkey" FOREIGN KEY ("imageAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
