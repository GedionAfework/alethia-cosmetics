-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" TEXT NOT NULL,
    "permission" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission")
);

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed the two starting roles so existing accounts can be moved onto them.
INSERT INTO "roles" ("id", "name", "description", "created_at", "updated_at") VALUES
('role_admin', 'Admin', 'Full access to the shop.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('role_employee', 'Employee', 'Take sales and view their own receipts.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "role_permissions" ("role_id", "permission") VALUES
('role_admin', 'dashboard:read'),
('role_admin', 'inventory:read'),
('role_admin', 'inventory:manage'),
('role_admin', 'stock:receive'),
('role_admin', 'alert:read'),
('role_admin', 'ledger:read'),
('role_admin', 'report:read'),
('role_admin', 'sale:create'),
('role_admin', 'sale:read-own'),
('role_admin', 'user:manage'),
('role_admin', 'role:manage'),
('role_employee', 'sale:create'),
('role_employee', 'sale:read-own');

-- Move each account onto a role, then drop the old enum column.
ALTER TABLE "users" ADD COLUMN "role_id" TEXT;

UPDATE "users" SET "role_id" = CASE WHEN "role" = 'ADMIN' THEN 'role_admin' ELSE 'role_employee' END;

ALTER TABLE "users" ALTER COLUMN "role_id" SET NOT NULL;

ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "users_role_id_idx" ON "users"("role_id");

ALTER TABLE "users" DROP COLUMN "role";

DROP TYPE "UserRole";
