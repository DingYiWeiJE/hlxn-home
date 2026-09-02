-- DropIndex
DROP INDEX IF EXISTS "MediaAsset_url_key";

-- AlterTable
ALTER TABLE "MediaAsset" DROP COLUMN IF EXISTS "url";
