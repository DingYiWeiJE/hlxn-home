-- CreateEnum
CREATE TYPE "NewsLocale" AS ENUM ('zh', 'en');

-- Add locale column with default value 'zh' for existing rows
ALTER TABLE "News" ADD COLUMN "locale" "NewsLocale" NOT NULL DEFAULT 'zh';

-- Drop the old unique constraint on slug
DROP INDEX "News_slug_key";

-- Create new unique constraint on (slug, locale)
CREATE UNIQUE INDEX "News_slug_locale_key" ON "News"("slug", "locale");

-- Create new index for locale-aware queries
CREATE INDEX "News_locale_status_publishedAt_idx" ON "News"("locale", "status", "publishedAt");

-- Drop the old index on (status, publishedAt) since we have a more specific one now
DROP INDEX "News_status_publishedAt_idx";
