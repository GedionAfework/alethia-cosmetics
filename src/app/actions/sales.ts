"use server";

import { revalidatePath } from "next/cache";
import { loadAccess } from "@/lib/auth/access";
import type { ActionResult } from "@/lib/action-result";
import { rateLimit } from "@/lib/rate-limit";
import { recordSale, type SaleLineInput } from "@/services/sales.service";

export async function createSaleAction(lines: SaleLineInput[]): Promise<ActionResult> {
  const access = await loadAccess();
  if (!access) return { ok: false, error: "Sign in first." };
  if (!access.ability.can("create", "Sale")) {
    return { ok: false, error: "You don't have permission to take a sale." };
  }
  const user = access.user;

  const limited = rateLimit(`sale:${user.id}`, 40, 60_000);
  if (!limited.ok) return { ok: false, error: "Too many submissions. Wait a moment." };

  try {
    const sale = await recordSale({ employeeId: user.id, lines });
    revalidatePath("/pos");
    revalidatePath("/pos/sales");
    revalidatePath("/admin");
    revalidatePath("/admin/inventory");
    revalidatePath("/admin/sales");
    revalidatePath("/admin/alerts");
    revalidatePath("/admin/reports");
    return { ok: true, saleId: sale.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not submit the sale." };
  }
}
