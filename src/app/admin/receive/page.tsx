import { ReceiveForm } from "@/components/admin/receive-form";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { requirePage } from "@/lib/auth/access";
import { getI18n } from "@/lib/i18n/server";
import { stockTabs } from "@/lib/nav";
import { listProducts } from "@/services/inventory.service";

export const dynamic = "force-dynamic";

export default async function ReceivePage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const access = await requirePage((ability) => ability.can("create", "StockReceipt"));
  const { product } = await searchParams;
  const [{ t }, products] = await Promise.all([getI18n(), listProducts({})]);

  return (
    <div>
      <Tabs items={stockTabs(access.ability, t)} />
      <div className="mx-auto max-w-xl">
        <PageHeader title={t.receive.title} />
        <ReceiveForm
          selectedId={product}
          products={products.map((item) => ({
            id: item.id,
            name: item.name,
            sku: item.sku,
            stockOnHand: item.stockOnHand,
          }))}
        />
      </div>
    </div>
  );
}
