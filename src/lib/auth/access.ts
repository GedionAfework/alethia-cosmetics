import { redirect } from "next/navigation";
import { canEnterOffice, defineAbilityFor, homePath, type Actions, type AppAbility, type Subjects } from "@/lib/auth/ability";
import { getCurrentUser } from "@/lib/auth/session";

export async function loadAccess() {
  const user = await getCurrentUser();
  if (!user) return null;
  return { user, ability: defineAbilityFor(user) };
}

export async function requireCan(action: Actions, subjectName: Subjects) {
  const access = await loadAccess();
  if (!access || !access.ability.can(action, subjectName)) return null;
  return access.user;
}

export async function requirePage(check: (ability: AppAbility) => boolean) {
  const access = await loadAccess();
  if (!access) redirect("/login");
  if (!check(access.ability)) redirect(homePath(access.ability));
  return access;
}

export async function requireOffice() {
  return requirePage(canEnterOffice);
}
