import { requirePage } from "@/lib/auth/access";

export default async function UsersSectionLayout({ children }: { children: React.ReactNode }) {
  await requirePage((ability) => ability.can("manage", "User"));
  return children;
}
