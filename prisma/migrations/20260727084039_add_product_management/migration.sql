-- CreateEnum
CREATE TYPE "MediaAssetType" AS ENUM ('IMAGE', 'PDF');

-- CreateEnum
CREATE TYPE "CategoryLevel" AS ENUM ('LEVEL_ONE', 'LEVEL_TWO');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'OFFLINE');

-- DropIndex
DROP INDEX "User_username_idx";

-- AlterTable
ALTER TABLE "MediaAsset" ADD COLUMN     "checksum" TEXT,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "type" "MediaAssetType" NOT NULL DEFAULT 'IMAGE',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "level" "CategoryLevel" NOT NULL,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "seriesName" TEXT,
    "secondaryCategoryId" TEXT NOT NULL,
    "summaryParagraphs" JSONB NOT NULL DEFAULT '[]',
    "highlights" JSONB NOT NULL DEFAULT '[]',
    "introductionParagraphs" JSONB NOT NULL DEFAULT '[]',
    "specificationTitle" TEXT,
    "specificationHeaders" JSONB,
    "specificationRows" JSONB,
    "detailPdfAssetId" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAdvantage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductAdvantage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductApplication" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_parentId_sortOrder_idx" ON "Category"("parentId", "sortOrder");

-- CreateIndex
CREATE INDEX "Category_level_enabled_idx" ON "Category"("level", "enabled");

-- CreateIndex
CREATE INDEX "Category_deletedAt_idx" ON "Category"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Category_parentId_name_key" ON "Category"("parentId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_secondaryCategoryId_status_sortOrder_idx" ON "Product"("secondaryCategoryId", "status", "sortOrder");

-- CreateIndex
CREATE INDEX "Product_status_sortOrder_idx" ON "Product"("status", "sortOrder");

-- CreateIndex
CREATE INDEX "Product_detailPdfAssetId_idx" ON "Product"("detailPdfAssetId");

-- CreateIndex
CREATE INDEX "Product_deletedAt_idx" ON "Product"("deletedAt");

-- CreateIndex
CREATE INDEX "ProductAdvantage_productId_sortOrder_idx" ON "ProductAdvantage"("productId", "sortOrder");

-- CreateIndex
CREATE INDEX "ProductAdvantage_assetId_idx" ON "ProductAdvantage"("assetId");

-- CreateIndex
CREATE INDEX "ProductApplication_productId_sortOrder_idx" ON "ProductApplication"("productId", "sortOrder");

-- CreateIndex
CREATE INDEX "ProductApplication_assetId_idx" ON "ProductApplication"("assetId");

-- CreateIndex
CREATE INDEX "MediaAsset_type_createdAt_idx" ON "MediaAsset"("type", "createdAt");

-- CreateIndex
CREATE INDEX "MediaAsset_type_enabled_deletedAt_idx" ON "MediaAsset"("type", "enabled", "deletedAt");

-- CreateIndex
CREATE INDEX "MediaAsset_createdById_idx" ON "MediaAsset"("createdById");

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_secondaryCategoryId_fkey" FOREIGN KEY ("secondaryCategoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_detailPdfAssetId_fkey" FOREIGN KEY ("detailPdfAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAdvantage" ADD CONSTRAINT "ProductAdvantage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAdvantage" ADD CONSTRAINT "ProductAdvantage_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductApplication" ADD CONSTRAINT "ProductApplication_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductApplication" ADD CONSTRAINT "ProductApplication_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
