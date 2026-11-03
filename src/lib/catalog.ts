import { ProductCategory } from "@prisma/client";

export const CATEGORIES: ProductCategory[] = [
  ProductCategory.COSMETICS,
  ProductCategory.PERFUMES,
  ProductCategory.GIFTS,
];

export function isCategory(value: string): value is ProductCategory {
  return (CATEGORIES as string[]).includes(value);
}

export type StockTone = "out" | "low" | "ok";

export function stockTone(stockOnHand: number, reorderLevel: number): StockTone {
  if (stockOnHand <= 0) return "out";
  if (stockOnHand <= reorderLevel) return "low";
  return "ok";
}
