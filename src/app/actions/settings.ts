"use server";

import { refresh, revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/action-result";
import { loadAccess } from "@/lib/auth/access";
import { removeLogo, saveLogo } from "@/services/settings.service";

async function requireSuperAdmin() {
  const access = await loadAccess();
  if (!access || !access.user.isSuperAdmin || !access.ability.can("manage", "Settings")) return null;
  return access.user;
}

export async function uploadLogoAction(formData: FormData): Promise<ActionResult> {
  if (!(await requireSuperAdmin())) return { ok: false, error: "Only a Super Admin can change the logo." };

  const file = formData.get("logo");
  if (!(file instanceof File)) return { ok: false, error: "Use a PNG, JPG or WebP image." };

  try {
    await saveLogo(Buffer.from(await file.arrayBuffer()));
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not save the logo." };
  }

  revalidatePath("/", "layout");
  refresh();
  return { ok: true };
}

export async function removeLogoAction(): Promise<ActionResult> {
  if (!(await requireSuperAdmin())) return { ok: false, error: "Only a Super Admin can change the logo." };
  await removeLogo();
  revalidatePath("/", "layout");
  refresh();
  return { ok: true };
}
