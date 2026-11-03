import { notFound, redirect } from "next/navigation";
import { subject } from "@casl/ability";
import { CircleCheck, Plus } from "lucide-react";
import { PrintButton } from "@/components/pos/print-button";
import { ButtonLink } from "@/components/ui/button";
import { loadAccess } from "@/lib/auth/access";
import { formatDateTime, formatMoney } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n/server";
import { getSale } from "@/services/sales.service";

export const dynamic = "force-dynamic";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await loadAccess();
  if (!access) redirect("/login");
  const [{ t, locale, fmt }, sale] = await Promise.all([getI18n(), getSale(id)]);
  if (!sale) notFound();
  const ownSale = sale.employeeId === access.user.id;
  const allowed =
    access.ability.can("read", "SalesLedger") ||
    access.ability.can("read", subject("Sale", { employeeId: sale.employeeId })) ||
    (ownSale && access.ability.can("create", "Sale"));
  if (!allowed) notFound();
  const money = (value: number) => formatMoney(value, locale);
  const canSell = access.ability.can("create", "Sale");

  return (
    <div className="mx-auto max-w-md">
      <div className="no-print mb-6 flex flex-col items-center text-center animate-rise">
        <span className="mb-3 grid size-14 place-items-center rounded-full bg-ok-soft text-ok">
          <CircleCheck className="size-7" />
        </span>
        <p className="tabular text-4xl font-extrabold tracking-tight">{money(Number(sale.total))}</p>
        <p className="mt-1 text-sm font-medium text-muted">{sale.saleNumber}</p>
      </div>

      <div className="no-print mb-5 grid grid-cols-2 gap-2">
        <PrintButton label={t.receipt.print} />
        {canSell && (
          <ButtonLink href="/pos" variant="secondary">
            <Plus />
            {t.receipt.newSale}
          </ButtonLink>
        )}
      </div>

      <article className="relative rounded-3xl bg-surface px-6 py-7 ring-1 ring-line shadow-[var(--shadow)] print:shadow-none print:ring-0">
        <p className="text-center text-xs font-bold tracking-[0.2em] text-accent uppercase">{t.brand.name}</p>
        <h1 className="text-center text-2xl font-extrabold tracking-tight">{t.brand.tagline}</h1>
        <div className="mt-4 space-y-0.5 text-center text-sm text-muted">
          <p className="font-semibold text-ink">{sale.saleNumber}</p>
          <p>{formatDateTime(sale.createdAt, locale)}</p>
          <p>{fmt(t.receipt.servedBy, { name: sale.employee.name })}</p>
        </div>
        <div className="mt-5 space-y-3 border-t border-dashed border-line pt-4 text-sm">
          {sale.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-3">
              <span>
                <span className="font-semibold">{item.productName}</span>
                <span className="tabular block text-muted">
                  {item.quantity} × {money(Number(item.unitPrice))}
                </span>
              </span>
              <span className="tabular font-semibold">{money(Number(item.subtotal))}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-end justify-between border-t border-dashed border-line pt-4">
          <span className="font-semibold text-muted">{t.common.total}</span>
          <span className="tabular text-2xl font-extrabold">{money(Number(sale.total))}</span>
        </div>
        <p className="mt-6 text-center text-sm font-semibold text-muted">{t.receipt.thanks}</p>
      </article>
    </div>
  );
}
