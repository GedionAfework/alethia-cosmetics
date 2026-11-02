import { requirePage } from "@/lib/auth/access";

export default async function SalesSectionLayout({ children }: { children: React.ReactNode }) {
  await requirePage((ability) => ability.can("read", "SalesLedger"));
  return children;
}
