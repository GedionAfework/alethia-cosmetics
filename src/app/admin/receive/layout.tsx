import { requirePage } from "@/lib/auth/access";

export default async function ReceiveSectionLayout({ children }: { children: React.ReactNode }) {
  await requirePage((ability) => ability.can("create", "StockReceipt"));
  return children;
}
