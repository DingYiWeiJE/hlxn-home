-- CreateTable
CREATE TABLE "CmsBranchImage" (
    "id" TEXT NOT NULL,
    "imageRelativePath" TEXT NOT NULL,
    "imageFilename" TEXT NOT NULL,
    "imageMimeType" TEXT NOT NULL,
    "imageSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CmsBranchImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CmsBranchImage_deletedAt_idx" ON "CmsBranchImage"("deletedAt");
