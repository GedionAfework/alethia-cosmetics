import Link from "next/link";
import { Button, ButtonAnchor } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { TextField } from "@/components/ui/fields";
import { PageHeader } from "@/components/ui/page-header";
import { requirePage } from "@/lib/auth/access";
import { formatShopTime } from "@/lib/time";
import { formatEtb } from "@/lib/utils";
import { getDailyLedger } from "@/services/sales.service";

export const dynamic = "force-dynamic";

export default async function DailySalesPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  await requirePage((ability) => ability.can("read", "SalesLedger"));
  const { date } = await searchParams;
  const ledger = await getDailyLedger(date);

  return (
    <div>
      <PageHeader
        title="Daily sales"
        description={`${ledger.sales.length} sales · ${ledger.units} units · ${formatEtb(ledger.revenue)}`}
        actions={
          <>
            <ButtonAnchor href={`/api/reports/daily?date=${ledger.label}&format=xls`}>Excel</ButtonAnchor>
            <ButtonAnchor href={`/api/reports/daily?date=${ledger.label}&format=pdf`}>PDF</ButtonAnchor>
          </>
        }
      />

      <form className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end" action="/admin/sales">
        <TextField label="Date" type="date" name="date" defaultValue={ledger.label} className="sm:w-52" />
        <Button type="submit" variant="secondary">
          Show
        </Button>
      </form>

      <div className="mt-6 space-y-4">
        {ledger.sales.length === 0 && <Empty>No sales on this day.</Empty>}
        {ledger.sales.map((sale) => (
          <Card key={sale.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <Link href={`/pos/receipt/${sale.id}`} className="font-semibold">
                  {sale.saleNumber}
                </Link>
                <p className="text-sm text-[var(--muted)]">
                  {formatShopTime(sale.createdAt)} · {sale.employee.name}
                </p>
              </div>
              <p className="font-display text-2xl">{formatEtb(Number(sale.total))}</p>
            </div>
            <ul className="mt-3 space-y-1 text-sm">
              {sale.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-3">
                  <span>
                    {item.productName} · {item.sku} × {item.quantity}
                  </span>
                  <span>{formatEtb(Number(item.subtotal))}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
