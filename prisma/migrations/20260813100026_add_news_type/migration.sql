-- CreateEnum
CREATE TYPE "NewsType" AS ENUM ('DYNAMIC', 'EVENT');

-- DropForeignKey
ALTER TABLE "Solution" DROP CONSTRAINT "Solution_coverImageAssetId_fkey";

-- AlterTable
ALTER TABLE "News" ADD COLUMN     "newsType" "NewsType" NOT NULL DEFAULT 'DYNAMIC';

-- AddForeignKey
ALTER TABLE "Solution" ADD CONSTRAINT "Solution_coverImageAssetId_fkey" FOREIGN KEY ("coverImageAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
