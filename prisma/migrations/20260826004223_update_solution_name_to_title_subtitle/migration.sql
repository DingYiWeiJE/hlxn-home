/*
  Warnings:

  - You are about to drop the column `name` on the `Solution` table. All the data in the column will be lost.
  - Added the required column `title` to the `Solution` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Solution" DROP COLUMN "name",
ADD COLUMN     "subtitle" TEXT,
ADD COLUMN     "title" TEXT DEFAULT 'Untitled';

-- Update existing NULL values
UPDATE "Solution" SET "title" = 'Untitled' WHERE "title" IS NULL;

-- Now make title NOT NULL
ALTER TABLE "Solution" ALTER COLUMN "title" SET NOT NULL;

-- Remove the default
ALTER TABLE "Solution" ALTER COLUMN "title" DROP DEFAULT;
