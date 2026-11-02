"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ProductCategory } from "@prisma/client";
import type { ActionResult } from "@/lib/action-result";
import { requireCan } from "@/lib/auth/access";
import { isCategory } from "@/lib/catalog";
import { field, intField, moneyField } from "@/lib/forms";
import {
  createProduct,
  receiveStock,
  removeProduct,
  updateProduct,
} from "@/services/inventory.service";

function revalidateInventory() {
  revalidatePath("/admin");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/alerts");
  revalidatePath("/admin/receive");
  revalidatePath("/pos");
}

export async function createProductAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireCan("manage", "Inventory");
  if (!user) return { ok: false, error: "You don't have permission to change inventory." };

  const name = field(formData, "name");
  const category = field(formData, "category");
  const unitPrice = moneyField(formData, "unitPrice");
  const reorderLevel = intField(formData, "reorderLevel");
  const openingQty = intField(formData, "openingQty") ?? 0;

  if (name.length < 2) return { ok: false, error: "Enter a product name." };
  if (!isCategory(category)) return { ok: false, error: "Choose a category." };
  if (unitPrice == null || unitPrice <= 0) return { ok: false, error: "Enter a price greater than zero." };
  if (reorderLevel == null || reorderLevel < 0) {
    return { ok: false, error: "Reorder level must be zero or more." };
  }
  if (openingQty < 0) return { ok: false, error: "Opening quantity cannot be negative." };

  try {
    await createProduct({
      name,
      category: category as ProductCategory,
      sku: field(formData, "sku"),
      barcode: field(formData, "barcode"),
      description: field(formData, "description"),
      unitPrice,
      reorderLevel,
      openingQty,
      userId: user.id,
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not save the product." };
  }

  revalidateInventory();
  redirect("/admin/inventory");
}

export async function updateProductAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireCan("manage", "Inventory");
  if (!user) return { ok: false, error: "You don't have permission to change inventory." };

  const id = field(formData, "id");
  const name = field(formData, "name");
  const category = field(formData, "category");
  const sku = field(formData, "sku");
  const unitPrice = moneyField(formData, "unitPrice");
  const reorderLevel = intField(formData, "reorderLevel");
  const adjustment = intField(formData, "adjustment") ?? 0;

  if (!id) return { ok: false, error: "Missing product." };
  if (name.length < 2) return { ok: false, error: "Enter a product name." };
  if (!sku) return { ok: false, error: "SKU is required." };
  if (!isCategory(category)) return { ok: false, error: "Choose a category." };
  if (unitPrice == null || unitPrice <= 0) return { ok: false, error: "Enter a price greater than zero." };
  if (reorderLevel == null || reorderLevel < 0) {
    return { ok: false, error: "Reorder level must be zero or more." };
  }

  try {
    await updateProduct({
      id,
      name,
      category: category as ProductCategory,
      sku,
      barcode: field(formData, "barcode"),
      description: field(formData, "description"),
      unitPrice,
      reorderLevel,
      isActive: formData.get("isActive") === "1",
      adjustment,
      adjustmentNote: field(formData, "adjustmentNote"),
      userId: user.id,
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not update the product." };
  }

  revalidateInventory();
  redirect(`/admin/inventory/${id}`);
}

export async function receiveStockAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireCan("create", "StockReceipt");
  if (!user) return { ok: false, error: "You don't have permission to receive stock." };
  const productId = field(formData, "productId");
  const quantity = intField(formData, "quantity");
  if (!productId) return { ok: false, error: "Choose a product." };
  if (quantity == null) return { ok: false, error: "Enter a whole quantity." };

  try {
    await receiveStock({
      productId,
      quantity,
      note: field(formData, "note"),
      userId: user.id,
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not receive stock." };
  }

  revalidateInventory();
  redirect("/admin/inventory?notice=received");
}

export async function deleteProductAction(formData: FormData) {
  const user = await requireCan("manage", "Inventory");
  if (!user) redirect("/login");
  const id = field(formData, "id");
  let archived = false;
  try {
    const result = await removeProduct(id);
    archived = result.archived;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not remove the product.";
    redirect(`/admin/inventory/${id}?error=${encodeURIComponent(message)}`);
  }
  revalidateInventory();
  redirect(archived ? "/admin/inventory?notice=archived" : "/admin/inventory?notice=deleted");
}
