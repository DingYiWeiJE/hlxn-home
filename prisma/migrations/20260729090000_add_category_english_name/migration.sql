ALTER TABLE "Category" ADD COLUMN "nameEn" TEXT NOT NULL DEFAULT '';

UPDATE "Category" SET "nameEn" = "name" WHERE "nameEn" = '';
