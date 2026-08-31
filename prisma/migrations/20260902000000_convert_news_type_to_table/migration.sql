-- Preserve existing enum values in a temp column
ALTER TABLE "News" ADD COLUMN "_oldNewsType" TEXT;
UPDATE "News" SET "_oldNewsType" = "newsType"::text;

-- Drop the old enum column and enum type
ALTER TABLE "News" DROP COLUMN "newsType";
DROP TYPE "NewsType";

-- CreateTable
CREATE TABLE "NewsType" (
    "id" TEXT NOT NULL,
    "chName" TEXT NOT NULL,
    "enName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "NewsType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NewsType_deletedAt_idx" ON "NewsType"("deletedAt");

-- Seed default news types (fixed IDs so front-end legacy URLs keep working)
INSERT INTO "NewsType" ("id", "chName", "enName", "createdAt", "updatedAt")
VALUES
    ('news_type_dynamic', '新闻动态', 'News & Updates', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('news_type_event', '展会活动', 'Exhibitions & Events', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- AlterTable: add FK column
ALTER TABLE "News" ADD COLUMN "newsTypeId" TEXT;

-- Backfill from preserved enum values
UPDATE "News" SET "newsTypeId" = 'news_type_dynamic' WHERE "_oldNewsType" = 'DYNAMIC' OR "_oldNewsType" IS NULL;
UPDATE "News" SET "newsTypeId" = 'news_type_event' WHERE "_oldNewsType" = 'EVENT';

-- Drop the temp column
ALTER TABLE "News" DROP COLUMN "_oldNewsType";

-- CreateIndex
CREATE INDEX "News_newsTypeId_idx" ON "News"("newsTypeId");

-- AddForeignKey
ALTER TABLE "News" ADD CONSTRAINT "News_newsTypeId_fkey" FOREIGN KEY ("newsTypeId") REFERENCES "NewsType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
