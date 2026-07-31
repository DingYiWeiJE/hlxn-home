-- CreateEnum
CREATE TYPE "StrategicLocationType" AS ENUM ('HEADQUARTERS', 'BRANCH', 'MARKETING', 'SERVICE');

-- CreateEnum
CREATE TYPE "StrategicLocationStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateTable
CREATE TABLE "StrategicLocation" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameZh" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "type" "StrategicLocationType" NOT NULL,
    "countryCode" TEXT NOT NULL,
    "countryNameZh" TEXT NOT NULL,
    "countryNameEn" TEXT NOT NULL,
    "provinceNameZh" TEXT,
    "provinceNameEn" TEXT,
    "cityNameZh" TEXT,
    "cityNameEn" TEXT,
    "longitude" DECIMAL(10,6) NOT NULL,
    "latitude" DECIMAL(10,6) NOT NULL,
    "establishment" TEXT,
    "staff" INTEGER,
    "descriptionZh" TEXT,
    "descriptionEn" TEXT,
    "businessScopeZh" JSONB NOT NULL DEFAULT '[]',
    "businessScopeEn" JSONB NOT NULL DEFAULT '[]',
    "imageUrl" TEXT,
    "status" "StrategicLocationStatus" NOT NULL DEFAULT 'DRAFT',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "StrategicLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StrategicLocation_code_key" ON "StrategicLocation"("code");

-- CreateIndex
CREATE INDEX "StrategicLocation_status_enabled_sortOrder_idx" ON "StrategicLocation"("status", "enabled", "sortOrder");

-- CreateIndex
CREATE INDEX "StrategicLocation_countryCode_status_enabled_idx" ON "StrategicLocation"("countryCode", "status", "enabled");

-- CreateIndex
CREATE INDEX "StrategicLocation_provinceNameZh_idx" ON "StrategicLocation"("provinceNameZh");

-- CreateIndex
CREATE INDEX "StrategicLocation_deletedAt_idx" ON "StrategicLocation"("deletedAt");
