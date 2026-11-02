import { ReceiveForm } from "@/components/admin/receive-form";
import { PageHeader } from "@/components/ui/page-header";
import { requirePage } from "@/lib/auth/access";
import { listProducts } from "@/services/inventory.service";

export const dynamic = "force-dynamic";

export default async function ReceivePage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  await requirePage((ability) => ability.can("create", "StockReceipt"));
  const { product } = await searchParams;
  const products = await listProducts({});

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        title="Receive stock"
        description="Every delivery increases received and the on-hand balance. Sold quantities stay as they are."
      />
      <ReceiveForm
        selectedId={product}
        products={products.map((item) => ({ id: item.id, name: item.name, sku: item.sku }))}
      />
    </div>
  );
}
