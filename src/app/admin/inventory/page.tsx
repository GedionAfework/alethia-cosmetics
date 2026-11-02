import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckboxField, SelectField, TextField } from "@/components/ui/fields";
import { Empty } from "@/components/ui/empty";
import { MetricGrid } from "@/components/ui/metric";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { requirePage } from "@/lib/auth/access";
import { categoryLabel, isCategory, stockLabel, stockTone } from "@/lib/catalog";
import { formatEtb } from "@/lib/utils";
import { listProducts } from "@/services/inventory.service";

export const dynamic = "force-dynamic";

const notices: Record<string, string> = {
  received: "Stock received and added to the balance.",
  archived: "This item has history, so it was archived instead of deleted.",
  deleted: "Product deleted.",
};

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; archived?: string; notice?: string }>;
}) {
  const access = await requirePage((ability) => ability.can("read", "Inventory"));
  const params = await searchParams;
  const canManage = access.ability.can("manage", "Inventory");
  const canReceive = access.ability.can("create", "StockReceipt");
  const category = params.category && isCategory(params.category) ? params.category : undefined;
  const products = await listProducts({
    q: params.q,
    category,
    includeArchived: params.archived === "1",
  });

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Alphabetical. On hand = received − sold + corrections."
        actions={canManage ? <ButtonLink href="/admin/inventory/new">Add product</ButtonLink> : undefined}
      />

      {params.notice && notices[params.notice] && (
        <div className="mt-4">
          <Notice tone="ok">{notices[params.notice]}</Notice>
        </div>
      )}

      <form className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end" action="/admin/inventory">
        <TextField
          label="Search"
          name="q"
          defaultValue={params.q || ""}
          placeholder="Name, SKU, or barcode"
          className="min-w-0 flex-1"
        />
        <SelectField label="Category" name="category" defaultValue={category || ""} className="sm:w-48">
          <option value="">All</option>
          <option value="COSMETICS">Cosmetics</option>
          <option value="PERFUMES">Perfumes</option>
          <option value="GIFTS">Gifts</option>
        </SelectField>
        <CheckboxField name="archived" value="1" defaultChecked={params.archived === "1"} label="Archived" className="sm:mb-3" />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      <div className="mt-4">
        {products.length === 0 && <Empty>No products match.</Empty>}
        {products.map((product) => {
          const tone = stockTone(product.stockOnHand, product.reorderLevel);
          return (
            <Card key={product.id} className="mb-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{product.name}</h2>
                  <p className="text-sm text-[var(--muted)]">
                    {categoryLabel(product.category)} · {product.sku}
                    {product.barcode ? ` · ${product.barcode}` : ""}
                    {!product.isActive ? " · Archived" : ""}
                  </p>
                </div>
                <Badge tone={product.isActive ? tone : "muted"}>
                  {product.isActive ? stockLabel(tone) : "Archived"}
                </Badge>
              </div>
              <MetricGrid
                items={[
                  { label: "Price", value: formatEtb(Number(product.unitPrice)) },
                  { label: "Received", value: String(product.totalReceived) },
                  { label: "Sold", value: String(product.totalSold) },
                  { label: "Corrections", value: String(product.totalAdjusted) },
                  { label: "On hand", value: String(product.stockOnHand) },
                ]}
              />
              <div className="mt-3 flex gap-2">
                {canManage && (
                  <ButtonLink href={`/admin/inventory/${product.id}`} variant="ghost" size="sm">
                    Edit
                  </ButtonLink>
                )}
                {canReceive && (
                  <ButtonLink href={`/admin/receive?product=${product.id}`} variant="ghost" size="sm">
                    Receive
                  </ButtonLink>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
