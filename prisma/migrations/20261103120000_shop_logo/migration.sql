-- CreateTable
CREATE TABLE "shop_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "logo" BYTEA,
    "logo_type" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_settings_pkey" PRIMARY KEY ("id")
);
