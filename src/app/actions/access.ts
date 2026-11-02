"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/lib/action-result";
import { requireCan } from "@/lib/auth/access";
import { selectedPermissions } from "@/lib/auth/permissions";
import { field } from "@/lib/forms";
import {
  createRole,
  createUser,
  deleteRole,
  grantSuperAdmin,
  transferSuperAdmin,
  updateRole,
  updateUser,
} from "@/services/access.service";

function refreshAccess() {
  revalidatePath("/admin/roles");
  revalidatePath("/admin/users");
  revalidatePath("/admin");
  revalidatePath("/pos");
  revalidatePath("/account");
  revalidatePath("/account/settings");
}

export async function createRoleAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const actor = await requireCan("manage", "Role");
  if (!actor) return { ok: false, error: "You don't have permission to manage roles." };

  try {
    await createRole({
      name: field(formData, "name"),
      description: field(formData, "description"),
      permissions: selectedPermissions(formData.getAll("permissions").map(String)),
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not create the role." };
  }

  refreshAccess();
  redirect("/admin/roles?notice=created");
}

export async function updateRoleAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const actor = await requireCan("manage", "Role");
  if (!actor) return { ok: false, error: "You don't have permission to manage roles." };

  try {
    await updateRole({
      id: field(formData, "id"),
      name: field(formData, "name"),
      description: field(formData, "description"),
      permissions: selectedPermissions(formData.getAll("permissions").map(String)),
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not update the role." };
  }

  refreshAccess();
  redirect("/admin/roles?notice=updated");
}

export async function deleteRoleAction(formData: FormData) {
  const actor = await requireCan("manage", "Role");
  if (!actor) redirect("/login");
  const id = field(formData, "id");
  try {
    await deleteRole(id);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not delete the role.";
    redirect(`/admin/roles/${id}?error=${encodeURIComponent(message)}`);
  }
  refreshAccess();
  redirect("/admin/roles?notice=deleted");
}

export async function createUserAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const actor = await requireCan("manage", "User");
  if (!actor) return { ok: false, error: "You don't have permission to manage users." };

  try {
    await createUser({
      name: field(formData, "name"),
      roleId: field(formData, "roleId"),
      telegramUsername: field(formData, "telegramUsername"),
      isSuperAdmin: formData.get("isSuperAdmin") === "1",
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not create the user." };
  }

  refreshAccess();
  redirect("/admin/users?notice=created");
}

export async function updateUserAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const actor = await requireCan("manage", "User");
  if (!actor) return { ok: false, error: "You don't have permission to manage users." };

  try {
    await updateUser({
      id: field(formData, "id"),
      actorId: actor.id,
      name: field(formData, "name"),
      roleId: field(formData, "roleId"),
      telegramUsername: field(formData, "telegramUsername"),
      isActive: formData.get("isActive") === "1",
      isSuperAdmin: formData.get("isSuperAdmin") === "1",
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not update the user." };
  }

  refreshAccess();
  redirect("/admin/users?notice=updated");
}

export async function grantSuperAdminAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const actor = await requireCan("manage", "Settings");
  if (!actor || !actor.isSuperAdmin) {
    return { ok: false, error: "Only a Super Admin can grant this access." };
  }

  try {
    await grantSuperAdmin({
      actorId: actor.id,
      targetId: field(formData, "targetId"),
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not grant Super Admin." };
  }

  refreshAccess();
  redirect("/account/settings?notice=granted");
}

export async function transferSuperAdminAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const actor = await requireCan("manage", "Settings");
  if (!actor || !actor.isSuperAdmin) {
    return { ok: false, error: "Only a Super Admin can hand off this access." };
  }

  try {
    await transferSuperAdmin({
      actorId: actor.id,
      targetId: field(formData, "targetId"),
      confirmTelegramUsername: field(formData, "confirmTelegramUsername"),
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not transfer Super Admin." };
  }

  refreshAccess();
  redirect("/account?notice=handed-off");
}
