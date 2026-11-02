import { notFound } from "next/navigation";
import { deleteProductAction, updateProductAction } from "@/app/actions/inventory";
import { ProductForm } from "@/components/admin/product-form";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { requirePage } from "@/lib/auth/access";
import { categoryLabel } from "@/lib/catalog";
import { formatShopDateTime } from "@/lib/time";
import { getProduct } from "@/services/inventory.service";

export const dynamic = "force-dynamic";

const movementLabel = {
  RECEIVED: "Received",
  SALE: "Sold",
  ADJUSTMENT: "Correction",
} as const;

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requirePage((ability) => ability.can("manage", "Inventory"));
  const { id } = await params;
  const { error } = await searchParams;
  const product = await getProduct(id);
  if (!product) notFound();

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div>
        <ButtonLink href="/admin/inventory" variant="ghost" size="sm">
          Back to inventory
        </ButtonLink>
        <div className="mt-3">
          <PageHeader
            title={product.name}
            description={`${categoryLabel(product.category)} · received ${product.totalReceived} · sold ${product.totalSold} · on hand ${product.stockOnHand}`}
          />
        </div>
        {error && (
          <div className="mt-4">
            <Notice tone="danger">{error}</Notice>
          </div>
        )}
        <div className="mt-6">
          <ProductForm
            action={updateProductAction}
            product={{
              id: product.id,
              name: product.name,
              sku: product.sku,
              barcode: product.barcode || "",
              category: product.category,
              description: product.description || "",
              unitPrice: Number(product.unitPrice).toFixed(2),
              reorderLevel: product.reorderLevel,
              isActive: product.isActive,
            }}
          />
        </div>
        <form action={deleteProductAction} className="mt-4">
          <input type="hidden" name="id" value={product.id} />
          <Button type="submit" variant="danger">
            Delete product
          </Button>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Items with stock history are archived so past sales stay intact.
          </p>
        </form>
      </div>
      <Card>
        <h2 className="font-display text-2xl">Recent movement</h2>
        <div className="mt-3 divide-y divide-[var(--border)]">
          {product.movements.length === 0 && <Empty>No movements yet.</Empty>}
          {product.movements.map((movement) => (
            <div key={movement.id} className="py-3 text-sm">
              <p className="font-semibold">
                {movementLabel[movement.type]} {movement.quantity > 0 && movement.type === "ADJUSTMENT" ? "+" : ""}
                {movement.quantity}
              </p>
              <p className="text-[var(--muted)]">
                {formatShopDateTime(movement.createdAt)}
                {movement.user ? ` · ${movement.user.name}` : ""}
              </p>
              {movement.note && <p>{movement.note}</p>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
