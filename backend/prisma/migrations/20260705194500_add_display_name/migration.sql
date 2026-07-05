-- AlterTable
ALTER TABLE "users" ADD COLUMN "display_name" VARCHAR(100);

-- Backfill existing users
UPDATE "users" SET "display_name" = "username" WHERE "display_name" IS NULL;

-- Enforce not null
ALTER TABLE "users" ALTER COLUMN "display_name" SET NOT NULL;
