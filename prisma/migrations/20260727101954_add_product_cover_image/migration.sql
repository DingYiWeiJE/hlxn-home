-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "coverImageAssetId" TEXT;

-- CreateIndex
CREATE INDEX "Product_coverImageAssetId_idx" ON "Product"("coverImageAssetId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_coverImageAssetId_fkey" FOREIGN KEY ("coverImageAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
