-- Add coverImageAssetId to Solution table
ALTER TABLE "Solution" ADD COLUMN "coverImageAssetId" TEXT;

-- Add foreign key constraint
ALTER TABLE "Solution" ADD CONSTRAINT "Solution_coverImageAssetId_fkey" FOREIGN KEY ("coverImageAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL;

-- Add index
CREATE INDEX "Solution_coverImageAssetId_idx" ON "Solution"("coverImageAssetId");
