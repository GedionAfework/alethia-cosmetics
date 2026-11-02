import { requirePage } from "@/lib/auth/access";

export default async function InventorySectionLayout({ children }: { children: React.ReactNode }) {
  await requirePage((ability) => ability.can("read", "Inventory"));
  return children;
}
