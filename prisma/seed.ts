import "./load-env";
import { Prisma, PrismaClient, ProductCategory } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";
import { ADMIN_PERMISSIONS, EMPLOYEE_PERMISSIONS } from "../src/lib/auth/permissions";

const prisma = new PrismaClient();

const catalog: {
  sku: string;
  barcode: string;
  name: string;
  category: ProductCategory;
  price: number;
  received: number;
  reorder: number;
  description: string;
}[] = [
  {
    sku: "LIP-001",
    barcode: "890100000001",
    name: "Velvet Lipstick",
    category: "COSMETICS",
    price: 450,
    received: 30,
    reorder: 5,
    description: "Rose-brown lipstick.",
  },
  {
    sku: "FND-001",
    barcode: "890100000002",
    name: "Soft Matte Foundation",
    category: "COSMETICS",
    price: 890,
    received: 14,
    reorder: 5,
    description: "Medium coverage foundation.",
  },
  {
    sku: "MAS-001",
    barcode: "890100000003",
    name: "Lengthening Mascara",
    category: "COSMETICS",
    price: 380,
    received: 12,
    reorder: 5,
    description: "Black mascara.",
  },
  {
    sku: "PER-001",
    barcode: "890100000004",
    name: "Rose Eau de Parfum",
    category: "PERFUMES",
    price: 2400,
    received: 10,
    reorder: 3,
    description: "Floral perfume, 50 ml.",
  },
  {
    sku: "MST-001",
    barcode: "890100000005",
    name: "Citrus Body Mist",
    category: "PERFUMES",
    price: 650,
    received: 5,
    reorder: 5,
    description: "Light citrus mist.",
  },
  {
    sku: "BOX-001",
    barcode: "890100000006",
    name: "Linen Gift Box",
    category: "GIFTS",
    price: 500,
    received: 18,
    reorder: 5,
    description: "Empty gift box with ribbon.",
  },
  {
    sku: "CND-001",
    barcode: "890100000007",
    name: "Amber Candle",
    category: "GIFTS",
    price: 420,
    received: 10,
    reorder: 5,
    description: "Scented candle.",
  },
  {
    sku: "CRM-001",
    barcode: "890100000008",
    name: "Shea Hand Cream",
    category: "COSMETICS",
    price: 280,
    received: 40,
    reorder: 5,
    description: "Unscented hand cream.",
  },
];

async function nextSaleNumber(tx: Prisma.TransactionClient, createdAt: Date) {
  const year = createdAt.getFullYear();
  const seq = await tx.saleSequence.upsert({
    where: { year },
    create: { year, lastValue: 1 },
    update: { lastValue: { increment: 1 } },
  });
  return `COS-${year}-${String(seq.lastValue).padStart(6, "0")}`;
}

async function ensureRole(name: string, description: string, permissions: string[]) {
  const existing = await prisma.role.findUnique({ where: { name } });
  if (existing) return existing;
  return prisma.role.create({
    data: {
      name,
      description,
      permissions: { create: permissions.map((permission) => ({ permission })) },
    },
  });
}

async function main() {
  const adminUsername = (process.env.SEED_ADMIN_USERNAME || "admin").toLowerCase();
  const employeeUsername = (process.env.SEED_EMPLOYEE_USERNAME || "cashier").toLowerCase();
  const adminTelegram = (process.env.ADMIN_TELEGRAM_USERNAMES || "")
    .split(",")[0]
    ?.trim()
    .replace(/^@/, "");
  const employeeTelegram = (process.env.SEED_EMPLOYEE_TELEGRAM || "").replace(/^@/, "");

  const adminRole = await ensureRole("Admin", "Full shop access. Super Admin status is separate.", ADMIN_PERMISSIONS);
  const employeeRole = await ensureRole(
    "Employee",
    "Take sales and view their own receipts.",
    EMPLOYEE_PERMISSIONS
  );

  // Strip legacy access-control permissions from roles if they still exist.
  await prisma.rolePermission.deleteMany({
    where: { permission: { in: ["role:manage", "user:manage"] } },
  });

  const admin = await prisma.user.upsert({
    where: { username: adminUsername },
    create: {
      name: process.env.SEED_ADMIN_NAME || "Aletheia Admin",
      username: adminUsername,
      passwordHash: await hashPassword(process.env.SEED_ADMIN_PASSWORD || "change-me-admin"),
      roleId: adminRole.id,
      telegramUsername: adminTelegram ? adminTelegram.toLowerCase() : null,
      isSuperAdmin: true,
    },
    update: {
      name: process.env.SEED_ADMIN_NAME || "Aletheia Admin",
      passwordHash: await hashPassword(process.env.SEED_ADMIN_PASSWORD || "change-me-admin"),
      isActive: true,
      isSuperAdmin: true,
      telegramUsername: adminTelegram ? adminTelegram.toLowerCase() : undefined,
    },
  });

  const cashier = await prisma.user.upsert({
    where: { username: employeeUsername },
    create: {
      name: process.env.SEED_EMPLOYEE_NAME || "Cashier",
      username: employeeUsername,
      passwordHash: await hashPassword(process.env.SEED_EMPLOYEE_PASSWORD || "change-me-staff"),
      roleId: employeeRole.id,
      telegramUsername: employeeTelegram ? employeeTelegram.toLowerCase() : null,
      isSuperAdmin: false,
    },
    update: {
      name: process.env.SEED_EMPLOYEE_NAME || "Cashier",
      passwordHash: await hashPassword(process.env.SEED_EMPLOYEE_PASSWORD || "change-me-staff"),
      isActive: true,
      isSuperAdmin: false,
      telegramUsername: employeeTelegram ? employeeTelegram.toLowerCase() : undefined,
    },
  });

  const existing = await prisma.product.count();
  if (existing > 0) {
    console.log("Staff updated. Catalog already present, so demo stock was left as-is.");
    return;
  }

  const products = new Map<string, { id: string; name: string; price: number }>();
  for (const item of catalog) {
    const product = await prisma.product.create({
      data: {
        name: item.name,
        sku: item.sku,
        barcode: item.barcode,
        category: item.category,
        description: item.description,
        unitPrice: item.price,
        reorderLevel: item.reorder,
        stockOnHand: item.received,
        totalReceived: item.received,
        movements: {
          create: {
            type: "RECEIVED",
            quantity: item.received,
            note: "Opening delivery",
            userId: admin.id,
            createdAt: new Date("2026-08-01T09:00:00+03:00"),
          },
        },
      },
    });
    products.set(item.sku, { id: product.id, name: product.name, price: item.price });
  }

  const sales: { at: Date; lines: { sku: string; qty: number }[] }[] = [
    {
      at: new Date("2026-08-15T11:20:00+03:00"),
      lines: [
        { sku: "CRM-001", qty: 4 },
        { sku: "MAS-001", qty: 2 },
      ],
    },
    {
      at: new Date("2026-09-02T15:05:00+03:00"),
      lines: [
        { sku: "FND-001", qty: 2 },
        { sku: "LIP-001", qty: 2 },
        { sku: "BOX-001", qty: 1 },
      ],
    },
    {
      at: new Date("2026-09-20T13:40:00+03:00"),
      lines: [
        { sku: "CND-001", qty: 4 },
        { sku: "MST-001", qty: 3 },
        { sku: "MAS-001", qty: 3 },
      ],
    },
    {
      at: new Date("2026-10-01T10:15:00+03:00"),
      lines: [
        { sku: "CRM-001", qty: 6 },
        { sku: "LIP-001", qty: 4 },
        { sku: "PER-001", qty: 2 },
        { sku: "MST-001", qty: 2 },
      ],
    },
    {
      at: new Date(),
      lines: [
        { sku: "CND-001", qty: 3 },
        { sku: "MAS-001", qty: 3 },
        { sku: "BOX-001", qty: 2 },
      ],
    },
  ];

  for (const sale of sales) {
    await prisma.$transaction(async (tx) => {
      let total = 0;
      let itemCount = 0;
      const prepared = sale.lines.map((line) => {
        const product = products.get(line.sku);
        if (!product) throw new Error(`Missing ${line.sku}`);
        const subtotal = product.price * line.qty;
        total += subtotal;
        itemCount += line.qty;
        return { ...line, ...product, subtotal };
      });
      const saleNumber = await nextSaleNumber(tx, sale.at);
      const created = await tx.sale.create({
        data: {
          saleNumber,
          employeeId: cashier.id,
          total,
          itemCount,
          createdAt: sale.at,
          items: {
            create: prepared.map((line) => ({
              productId: line.id,
              productName: line.name,
              sku: line.sku,
              quantity: line.qty,
              unitPrice: line.price,
              subtotal: line.subtotal,
            })),
          },
        },
      });
      for (const line of prepared) {
        const updated = await tx.product.updateMany({
          where: { id: line.id, stockOnHand: { gte: line.qty } },
          data: {
            stockOnHand: { decrement: line.qty },
            totalSold: { increment: line.qty },
          },
        });
        if (updated.count !== 1) throw new Error(`Not enough stock for ${line.sku}`);
        await tx.stockMovement.create({
          data: {
            productId: line.id,
            type: "SALE",
            quantity: line.qty,
            note: saleNumber,
            userId: cashier.id,
            saleId: created.id,
            createdAt: sale.at,
          },
        });
      }
    });
  }

  console.log("Seed complete.", {
    admin: admin.username,
    employee: cashier.username,
    products: catalog.length,
    sales: sales.length,
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
