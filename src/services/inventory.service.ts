import { Prisma, ProductCategory } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { isAdminAccount, type TelegramUser } from "@/lib/telegram/validate";
import { clearStockAlertIfRecovered } from "@/services/notification.service";

const userWithRole = { include: { role: { include: { permissions: true } } } } as const;

export async function linkTelegramAccount(tg: TelegramUser) {
  const telegramId = BigInt(tg.id);
  const username = tg.username?.replace(/^@/, "") || null;

  const byId = await prisma.user.findUnique({ where: { telegramId }, ...userWithRole });
  if (byId) return byId.isActive ? byId : null;

  if (username) {
    const byName = await prisma.user.findFirst({
      where: {
        telegramUsername: { equals: username, mode: "insensitive" },
        isActive: true,
      },
      ...userWithRole,
    });
    if (byName && (byName.telegramId == null || byName.telegramId === telegramId)) {
      return prisma.user.update({
        where: { id: byName.id },
        data: { telegramId, telegramUsername: username },
        ...userWithRole,
      });
    }
  }

  if (isAdminAccount({ telegramId, username })) {
    const owner = await prisma.user.findFirst({
      where: {
        isActive: true,
        isSuperAdmin: true,
      },
      orderBy: { createdAt: "asc" },
      ...userWithRole,
    });
    if (owner && (owner.telegramId == null || owner.telegramId === telegramId)) {
      return prisma.user.update({
        where: { id: owner.id },
        data: {
          telegramId,
          telegramUsername: username || owner.telegramUsername,
        },
        ...userWithRole,
      });
    }
  }

  return null;
}

function skuFromName(name: string) {
  const base = name.toUpperCase().replace(/[^A-Z0-9]+/g, "").slice(0, 8) || "ITEM";
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base}-${suffix}`;
}

export async function listProducts(filters: {
  q?: string;
  category?: ProductCategory;
  includeArchived?: boolean;
}) {
  const q = filters.q?.trim();
  return prisma.product.findMany({
    where: {
      isActive: filters.includeArchived ? undefined : true,
      category: filters.category,
      OR: q
        ? [
            { name: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
            { barcode: { contains: q, mode: "insensitive" } },
          ]
        : undefined,
    },
    orderBy: { name: "asc" },
  });
}

export async function getProduct(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      movements: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { user: { select: { name: true } } },
      },
    },
  });
}

export async function listSellableProducts() {
  return prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

async function uniqueSku(preferred: string) {
  let sku = preferred.trim().toUpperCase();
  if (!sku) sku = skuFromName("ITEM");
  for (let i = 0; i < 5; i++) {
    const existing = await prisma.product.findUnique({ where: { sku } });
    if (!existing) return sku;
    sku = skuFromName(preferred || "ITEM");
  }
  throw new Error("Could not create a unique SKU. Enter one manually.");
}

export async function createProduct(input: {
  name: string;
  category: ProductCategory;
  sku?: string;
  barcode?: string;
  description?: string;
  unitPrice: number;
  reorderLevel: number;
  openingQty: number;
  userId: string;
}) {
  const sku = await uniqueSku(input.sku || skuFromName(input.name));
  const barcode = input.barcode?.trim() || null;

  try {
    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: input.name.trim(),
          sku,
          barcode,
          category: input.category,
          description: input.description?.trim() || null,
          unitPrice: input.unitPrice,
          reorderLevel: input.reorderLevel,
          stockOnHand: input.openingQty,
          totalReceived: input.openingQty,
        },
      });
      if (input.openingQty > 0) {
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            type: "RECEIVED",
            quantity: input.openingQty,
            note: "Opening stock",
            userId: input.userId,
          },
        });
      }
      return product;
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new Error("That SKU or barcode is already used.");
    }
    throw err;
  }
}

export async function updateProduct(input: {
  id: string;
  name: string;
  category: ProductCategory;
  sku: string;
  barcode?: string;
  description?: string;
  unitPrice: number;
  reorderLevel: number;
  isActive: boolean;
  adjustment: number;
  adjustmentNote?: string;
  userId: string;
}) {
  const product = await prisma.product.findUnique({ where: { id: input.id } });
  if (!product) throw new Error("Product not found.");
  if (input.adjustment !== 0 && !input.adjustmentNote?.trim()) {
    throw new Error("Add a note for the stock correction.");
  }
  const nextStock = product.stockOnHand + input.adjustment;
  if (nextStock < 0) throw new Error("Correction would make stock negative.");

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const saved = await tx.product.update({
        where: { id: product.id },
        data: {
          name: input.name.trim(),
          sku: input.sku.trim().toUpperCase(),
          barcode: input.barcode?.trim() || null,
          category: input.category,
          description: input.description?.trim() || null,
          unitPrice: input.unitPrice,
          reorderLevel: input.reorderLevel,
          isActive: input.isActive,
          stockOnHand: { increment: input.adjustment },
          totalAdjusted: { increment: input.adjustment },
        },
      });
      if (input.adjustment !== 0) {
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            type: "ADJUSTMENT",
            quantity: input.adjustment,
            note: input.adjustmentNote?.trim(),
            userId: input.userId,
          },
        });
      }
      return saved;
    });
    await clearStockAlertIfRecovered(updated.id);
    return updated;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new Error("That SKU or barcode is already used.");
    }
    throw err;
  }
}

export async function receiveStock(input: {
  productId: string;
  quantity: number;
  note?: string;
  userId: string;
}) {
  if (!Number.isInteger(input.quantity) || input.quantity < 1) {
    throw new Error("Quantity received must be at least 1.");
  }
  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product) throw new Error("Product not found.");

  const updated = await prisma.$transaction(async (tx) => {
    const saved = await tx.product.update({
      where: { id: product.id },
      data: {
        stockOnHand: { increment: input.quantity },
        totalReceived: { increment: input.quantity },
      },
    });
    await tx.stockMovement.create({
      data: {
        productId: product.id,
        type: "RECEIVED",
        quantity: input.quantity,
        note: input.note?.trim() || "Stock received",
        userId: input.userId,
      },
    });
    return saved;
  });
  await clearStockAlertIfRecovered(updated.id);
  return updated;
}

export async function removeProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { _count: { select: { movements: true, saleItems: true } } },
  });
  if (!product) throw new Error("Product not found.");

  if (product._count.movements > 0 || product._count.saleItems > 0) {
    await prisma.product.update({ where: { id }, data: { isActive: false } });
    return { archived: true as const };
  }

  await prisma.product.delete({ where: { id } });
  return { archived: false as const };
}

export async function stockAlertLists() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  return {
    out: products.filter((p) => p.stockOnHand <= 0),
    low: products.filter((p) => p.stockOnHand > 0 && p.stockOnHand <= p.reorderLevel),
  };
}
