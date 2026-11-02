import { requirePage } from "@/lib/auth/access";

export default async function AlertsSectionLayout({ children }: { children: React.ReactNode }) {
  await requirePage((ability) => ability.can("read", "Alert"));
  return children;
}
