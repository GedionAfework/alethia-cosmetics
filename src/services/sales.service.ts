import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { MONTHS, dayRange, monthRange, shopMonthIndex, shopYear } from "@/lib/time";
import { roundMoney } from "@/lib/utils";
import { notifyStockLevel } from "@/services/notification.service";

export type SaleLineInput = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

function mergeLines(lines: SaleLineInput[]) {
  const map = new Map<string, SaleLineInput>();
  for (const line of lines) {
    const existing = map.get(line.productId);
    if (!existing) {
      map.set(line.productId, { ...line });
      continue;
    }
    const quantity = existing.quantity + line.quantity;
    const value = existing.unitPrice * existing.quantity + line.unitPrice * line.quantity;
    existing.quantity = quantity;
    existing.unitPrice = roundMoney(value / quantity);
  }
  return [...map.values()];
}

async function nextSaleNumber(tx: Prisma.TransactionClient, createdAt: Date) {
  const year = shopYear(createdAt);
  const seq = await tx.saleSequence.upsert({
    where: { year },
    create: { year, lastValue: 1 },
    update: { lastValue: { increment: 1 } },
  });
  return `COS-${year}-${String(seq.lastValue).padStart(6, "0")}`;
}

export async function recordSale(input: {
  employeeId: string;
  lines: SaleLineInput[];
  createdAt?: Date;
  silent?: boolean;
}) {
  const lines = mergeLines(input.lines);
  if (lines.length === 0) throw new Error("Add at least one item.");
  if (lines.length > 40) throw new Error("A sale can include at most 40 items.");

  const createdAt = input.createdAt ?? new Date();

  const result = await prisma.$transaction(async (tx) => {
    let total = 0;
    let itemCount = 0;
    const prepared: {
      productId: string;
      name: string;
      sku: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }[] = [];

    for (const line of lines) {
      if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 10000) {
        throw new Error("Quantity must be a whole number of at least 1.");
      }
      const unitPrice = roundMoney(line.unitPrice);
      if (!Number.isFinite(unitPrice) || unitPrice < 0 || unitPrice > 1_000_000) {
        throw new Error("Confirm a valid unit price.");
      }
      const product = await tx.product.findUnique({ where: { id: line.productId } });
      if (!product || !product.isActive) throw new Error("An item is no longer for sale.");
      if (product.stockOnHand < line.quantity) {
        throw new Error(`${product.name} only has ${product.stockOnHand} in stock.`);
      }
      const subtotal = roundMoney(unitPrice * line.quantity);
      total = roundMoney(total + subtotal);
      itemCount += line.quantity;
      prepared.push({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        quantity: line.quantity,
        unitPrice,
        subtotal,
      });
    }

    const saleNumber = await nextSaleNumber(tx, createdAt);
    const sale = await tx.sale.create({
      data: {
        saleNumber,
        employeeId: input.employeeId,
        total,
        itemCount,
        createdAt,
        items: {
          create: prepared.map((line) => ({
            productId: line.productId,
            productName: line.name,
            sku: line.sku,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            subtotal: line.subtotal,
          })),
        },
      },
    });

    const touched = [];
    for (const line of prepared) {
      const updated = await tx.product.updateMany({
        where: {
          id: line.productId,
          isActive: true,
          stockOnHand: { gte: line.quantity },
        },
        data: {
          stockOnHand: { decrement: line.quantity },
          totalSold: { increment: line.quantity },
        },
      });
      if (updated.count !== 1) {
        throw new Error(`${line.name} does not have enough stock.`);
      }
      await tx.stockMovement.create({
        data: {
          productId: line.productId,
          type: "SALE",
          quantity: line.quantity,
          note: saleNumber,
          userId: input.employeeId,
          saleId: sale.id,
          createdAt,
        },
      });
      const fresh = await tx.product.findUnique({ where: { id: line.productId } });
      if (fresh) touched.push(fresh);
    }

    return { sale, touched };
  });

  if (!input.silent) {
    await Promise.all(
      result.touched.map((product) => notifyStockLevel(product).catch(() => undefined))
    );
  }

  return result.sale;
}

const saleInclude = {
  employee: { select: { id: true, name: true, username: true } },
  items: { orderBy: { productName: "asc" as const } },
};

export async function getSale(id: string) {
  return prisma.sale.findUnique({ where: { id }, include: saleInclude });
}

export async function listRecentSales(limit = 8) {
  return prisma.sale.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: saleInclude,
  });
}

export async function listEmployeeSales(employeeId: string) {
  return prisma.sale.findMany({
    where: { employeeId },
    orderBy: { createdAt: "desc" },
    take: 40,
    include: saleInclude,
  });
}

export async function getDailyLedger(dateStr?: string) {
  const range = dayRange(dateStr);
  const sales = await prisma.sale.findMany({
    where: { createdAt: { gte: range.start, lt: range.end } },
    orderBy: { createdAt: "asc" },
    include: saleInclude,
  });
  const revenue = roundMoney(sales.reduce((sum, sale) => sum + Number(sale.total), 0));
  const units = sales.reduce((sum, sale) => sum + sale.itemCount, 0);
  return { ...range, sales, revenue, units };
}

export type MonthRow = {
  month: number;
  label: string;
  sales: number;
  units: number;
  revenue: number;
  change: number | null;
};

export async function getMonthlyReport(year: number) {
  const rows: MonthRow[] = [];
  for (let month = 0; month < 12; month++) {
    const range = monthRange(year, month);
    const [count, sums] = await Promise.all([
      prisma.sale.count({ where: { createdAt: { gte: range.start, lt: range.end } } }),
      prisma.sale.aggregate({
        where: { createdAt: { gte: range.start, lt: range.end } },
        _sum: { total: true, itemCount: true },
      }),
    ]);
    const revenue = roundMoney(Number(sums._sum.total || 0));
    const previous = rows[month - 1]?.revenue ?? 0;
    const change =
      month === 0 ? null : previous === 0 ? (revenue === 0 ? 0 : null) : ((revenue - previous) / previous) * 100;
    rows.push({
      month,
      label: MONTHS[month],
      sales: count,
      units: sums._sum.itemCount || 0,
      revenue,
      change,
    });
  }
  const revenue = roundMoney(rows.reduce((sum, row) => sum + row.revenue, 0));
  const units = rows.reduce((sum, row) => sum + row.units, 0);
  const sales = rows.reduce((sum, row) => sum + row.sales, 0);
  return { year, rows, revenue, units, sales };
}

export async function getDashboard() {
  const today = await getDailyLedger();
  const range = monthRange(shopYear(), shopMonthIndex());
  const [monthAgg, recent, products] = await Promise.all([
    prisma.sale.aggregate({
      where: { createdAt: { gte: range.start, lt: range.end } },
      _sum: { total: true, itemCount: true },
    }),
    listRecentSales(6),
    prisma.product.findMany({
      where: { isActive: true },
      select: { stockOnHand: true, reorderLevel: true },
    }),
  ]);
  return {
    today,
    monthRevenue: roundMoney(Number(monthAgg._sum.total || 0)),
    monthUnits: monthAgg._sum.itemCount || 0,
    recent,
    outCount: products.filter((p) => p.stockOnHand <= 0).length,
    lowCount: products.filter((p) => p.stockOnHand > 0 && p.stockOnHand <= p.reorderLevel).length,
    skuCount: products.length,
  };
}
