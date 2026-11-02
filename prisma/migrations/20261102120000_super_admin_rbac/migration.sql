-- AlterTable
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN "is_super_admin" BOOLEAN NOT NULL DEFAULT false;

-- Normalize blank telegram usernames to NULL so a unique index can be added.
UPDATE "users" SET "telegram_username" = NULL WHERE "telegram_username" IS NOT NULL AND TRIM("telegram_username") = '';

-- Lowercase existing telegram usernames for case-insensitive uniqueness.
UPDATE "users" SET "telegram_username" = LOWER("telegram_username") WHERE "telegram_username" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_telegram_username_key" ON "users"("telegram_username");

-- Promote anyone who currently holds role/user manage to Super Admin.
UPDATE "users" SET "is_super_admin" = true
WHERE "is_active" = true
  AND "role_id" IN (
    SELECT "role_id" FROM "role_permissions"
    WHERE "permission" IN ('role:manage', 'user:manage')
  );

-- If somehow nobody was promoted, promote the oldest active user.
UPDATE "users" SET "is_super_admin" = true
WHERE "id" = (
  SELECT "id" FROM "users" WHERE "is_active" = true ORDER BY "created_at" ASC LIMIT 1
)
AND NOT EXISTS (SELECT 1 FROM "users" WHERE "is_super_admin" = true);

-- Drop access-control permissions from roles; Super Admin owns those now.
DELETE FROM "role_permissions" WHERE "permission" IN ('role:manage', 'user:manage');
