-- AlterTable
ALTER TABLE "Solution" ADD COLUMN     "categoryId" TEXT;

-- CreateTable
CREATE TABLE "SolutionCategory" (
    "id" TEXT NOT NULL,
    "chName" TEXT NOT NULL,
    "enName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SolutionCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SolutionCategory_deletedAt_idx" ON "SolutionCategory"("deletedAt");

-- CreateIndex
CREATE INDEX "Solution_categoryId_idx" ON "Solution"("categoryId");

-- AddForeignKey
ALTER TABLE "Solution" ADD CONSTRAINT "Solution_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "SolutionCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
