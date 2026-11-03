import { notFound } from "next/navigation";
import { ArrowDownToLine, ArrowUpFromLine, History, PackagePlus, SlidersHorizontal, Trash2 } from "lucide-react";
import { deleteProductAction, updateProductAction } from "@/app/actions/inventory";
import { ProductForm } from "@/components/admin/product-form";
import { Button, ButtonLink } from "@/components/ui/button";
import { SectionTitle } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { IconTile, List, ListRow } from "@/components/ui/list";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { requirePage } from "@/lib/auth/access";
import { formatDateTime } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n/server";
import { getProduct } from "@/services/inventory.service";

export const dynamic = "force-dynamic";

const movementIcon = {
  RECEIVED: { icon: ArrowDownToLine, tone: "ok" },
  SALE: { icon: ArrowUpFromLine, tone: "accent" },
  ADJUSTMENT: { icon: SlidersHorizontal, tone: "warn" },
} as const;

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const access = await requirePage((ability) => ability.can("manage", "Inventory"));
  const { id } = await params;
  const { error } = await searchParams;
  const [{ t, locale, err }, product] = await Promise.all([getI18n(), getProduct(id)]);
  if (!product) notFound();
  const canReceive = access.ability.can("create", "StockReceipt");

  const metrics = [
    { label: t.inventory.onHand, value: product.stockOnHand, strong: true },
    { label: t.inventory.received, value: product.totalReceived },
    { label: t.inventory.sold, value: product.totalSold },
    { label: t.inventory.corrections, value: product.totalAdjusted },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={product.name}
        eyebrow={`${t.categories[product.category]} · ${product.sku}`}
        back={{ href: "/admin/inventory", label: t.inventory.title }}
        actions={
          canReceive ? (
            <ButtonLink href={`/admin/receive?product=${product.id}`} variant="soft">
              <PackagePlus />
              {t.nav.receive}
            </ButtonLink>
          ) : undefined
        }
      />

      {error && <Notice tone="danger" className="mb-4">{err(error)}</Notice>}

      <div className="mb-6 grid grid-cols-4 gap-2">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className={
              metric.strong
                ? "rounded-2xl bg-accent px-3 py-3 text-on-accent"
                : "rounded-2xl bg-surface px-3 py-3 ring-1 ring-line"
            }
          >
            <p className="tabular text-xl font-bold">{metric.value}</p>
            <p className={`truncate text-[11px] font-semibold ${metric.strong ? "text-on-accent/80" : "text-muted"}`}>
              {metric.label}
            </p>
          </div>
        ))}
      </div>

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

      <section className="mt-10">
        <SectionTitle>{t.inventory.history}</SectionTitle>
        {product.movements.length === 0 ? (
          <Empty icon={History}>{t.inventory.noHistory}</Empty>
        ) : (
          <List>
            {product.movements.map((movement) => {
              const meta = movementIcon[movement.type];
              const signed =
                movement.type === "SALE" ? `−${movement.quantity}` : movement.quantity > 0 ? `+${movement.quantity}` : String(movement.quantity);
              return (
                <ListRow
                  key={movement.id}
                  leading={<IconTile icon={meta.icon} tone={meta.tone} />}
                  title={movement.note || t.movement[movement.type]}
                  subtitle={`${formatDateTime(movement.createdAt, locale)}${movement.user ? ` · ${movement.user.name}` : ""}`}
                  trailing={<span className="tabular font-bold">{signed}</span>}
                />
              );
            })}
          </List>
        )}
      </section>

      <form action={deleteProductAction} className="mt-8">
        <input type="hidden" name="id" value={product.id} />
        <Button type="submit" variant="danger">
          <Trash2 />
          {t.inventory.deleteProduct}
        </Button>
      </form>
    </div>
  );
}
