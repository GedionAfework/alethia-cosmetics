import { PosTerminal } from "@/components/pos/pos-terminal";
import { PageHeader } from "@/components/ui/page-header";
import { requirePage } from "@/lib/auth/access";
import { listSellableProducts } from "@/services/inventory.service";

export const dynamic = "force-dynamic";

export default async function PosPage() {
  await requirePage((ability) => ability.can("create", "Sale"));
  const products = await listSellableProducts();

  return (
    <div>
      <div className="mb-6">
        <PageHeader
          title="Sell"
          description="Search, scan a barcode, or use a USB scanner. Submitting deducts stock and adds the total to today's ledger."
        />
      </div>
      <PosTerminal
        products={products.map((product) => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          barcode: product.barcode,
          category: product.category,
          unitPrice: Number(product.unitPrice),
          stockOnHand: product.stockOnHand,
          reorderLevel: product.reorderLevel,
        }))}
      />
    </div>
  );
}
