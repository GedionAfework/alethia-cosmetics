import { ButtonLink } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { PageHeader } from "@/components/ui/page-header";
import { requirePage } from "@/lib/auth/access";
import { stockAlertLists } from "@/services/inventory.service";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  await requirePage((ability) => ability.can("read", "Alert"));
  const { out, low } = await stockAlertLists();

  return (
    <div className="space-y-10">
      <PageHeader
        title="Alerts"
        description="Out of stock means nothing is left to sell. Low stock means the balance is still above zero and at or below that item's reorder level. A sale that crosses the line also messages Telegram accounts that can view alerts."
      />

      <section>
        <h2 className="font-display text-2xl">Out of stock</h2>
        {out.length === 0 && <Empty>Nothing is sold out.</Empty>}
        {out.map((product) => (
          <article key={product.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] py-3">
            <div>
              <p className="font-semibold">{product.name}</p>
              <p className="text-sm text-[var(--muted)]">
                {product.sku} · sold {product.totalSold} · received {product.totalReceived}
              </p>
            </div>
            <ButtonLink href={`/admin/receive?product=${product.id}`} variant="secondary">
              Receive
            </ButtonLink>
          </article>
        ))}
      </section>

      <section>
        <h2 className="font-display text-2xl">Low stock</h2>
        {low.length === 0 && <Empty>Nothing is close to selling out.</Empty>}
        {low.map((product) => (
          <article key={product.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] py-3">
            <div>
              <p className="font-semibold">{product.name}</p>
              <p className="text-sm text-[var(--warn)]">
                {product.stockOnHand} left · reorder at {product.reorderLevel}
              </p>
            </div>
            <ButtonLink href={`/admin/receive?product=${product.id}`} variant="secondary">
              Receive
            </ButtonLink>
          </article>
        ))}
      </section>
    </div>
  );
}
