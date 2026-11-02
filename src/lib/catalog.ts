import { ProductCategory } from "@prisma/client";

export const CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: ProductCategory.COSMETICS, label: "Cosmetics" },
  { value: ProductCategory.PERFUMES, label: "Perfumes" },
  { value: ProductCategory.GIFTS, label: "Gifts" },
];

export function categoryLabel(value: string) {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function isCategory(value: string): value is ProductCategory {
  return CATEGORIES.some((c) => c.value === value);
}

export type StockTone = "out" | "low" | "ok";

export function stockTone(stockOnHand: number, reorderLevel: number): StockTone {
  if (stockOnHand <= 0) return "out";
  if (stockOnHand <= reorderLevel) return "low";
  return "ok";
}

export function stockLabel(tone: StockTone) {
  if (tone === "out") return "Out of stock";
  if (tone === "low") return "Low stock";
  return "In stock";
}
