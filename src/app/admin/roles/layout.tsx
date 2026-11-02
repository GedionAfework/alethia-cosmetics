import { requirePage } from "@/lib/auth/access";

export default async function RolesSectionLayout({ children }: { children: React.ReactNode }) {
  await requirePage((ability) => ability.can("manage", "Role"));
  return children;
}
