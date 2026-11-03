import Link from "next/link";
import { ChevronDown, Layers, Receipt, ShoppingBag, Wallet } from "lucide-react";
import { AutoSubmitInput } from "@/components/ui/auto-submit";
import { Avatar } from "@/components/ui/avatar";
import { Empty } from "@/components/ui/empty";
import { ExportButtons } from "@/components/ui/export-buttons";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Tabs } from "@/components/ui/tabs";
import { requirePage } from "@/lib/auth/access";
import { formatLongDate, formatMoney, formatTime } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n/server";
import { salesTabs } from "@/lib/nav";
import { getDailyLedger } from "@/services/sales.service";

export const dynamic = "force-dynamic";

export default async function DailySalesPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const access = await requirePage((ability) => ability.can("read", "SalesLedger"));
  const { date } = await searchParams;
  const [{ t, locale }, ledger] = await Promise.all([getI18n(), getDailyLedger(date)]);
  const money = (value: number) => formatMoney(value, locale);

  return (
    <div>
      <Tabs items={salesTabs(access.ability, t)} />
      <PageHeader
        title={t.sales.dailyTitle}
        eyebrow={formatLongDate(ledger.label, locale)}
        actions={
          <ExportButtons
            base={`/api/reports/daily?date=${ledger.label}`}
            labels={{ excel: t.common.excel, pdf: t.common.pdf }}
          />
        }
      />

      <form action="/admin/sales" className="mb-5">
        <AutoSubmitInput type="date" name="date" defaultValue={ledger.label} aria-label={t.sales.date} />
      </form>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard highlight icon={Wallet} label={t.common.revenue} value={money(ledger.revenue)} className="col-span-2 sm:col-span-1" />
        <StatCard icon={ShoppingBag} label={t.common.sales} value={String(ledger.sales.length)} />
        <StatCard icon={Layers} tone="ok" label={t.common.units} value={String(ledger.units)} />
      </div>

      {ledger.sales.length === 0 ? (
        <Empty icon={Receipt}>{t.sales.empty}</Empty>
      ) : (
        <div className="space-y-3">
          {ledger.sales.map((sale) => (
            <details
              key={sale.id}
              className="group overflow-hidden rounded-3xl bg-surface ring-1 ring-line shadow-[var(--shadow)]"
            >
              <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
                <Avatar name={sale.employee.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold">{sale.saleNumber}</p>
                  <p className="truncate text-[13px] text-muted">
                    {formatTime(sale.createdAt, locale)} · {sale.employee.name}
                  </p>
                </div>
                <span className="tabular font-bold">{money(Number(sale.total))}</span>
                <ChevronDown className="size-4 text-muted transition group-open:rotate-180" />
              </summary>
              <div className="border-t border-line bg-surface-2/50 px-4 py-3">
                <ul className="space-y-2 text-sm">
                  {sale.items.map((item) => (
                    <li key={item.id} className="flex justify-between gap-3">
                      <span className="min-w-0 truncate">
                        <span className="font-semibold">{item.quantity}×</span> {item.productName}
                      </span>
                      <span className="tabular shrink-0">{money(Number(item.subtotal))}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/pos/receipt/${sale.id}`}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent"
                >
                  <Receipt className="size-4" />
                  {t.nav.receipts}
                </Link>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
