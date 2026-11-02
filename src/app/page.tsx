import { redirect } from "next/navigation";
import { defineAbilityFor, homePath } from "@/lib/auth/ability";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  redirect(homePath(defineAbilityFor(user)));
}
