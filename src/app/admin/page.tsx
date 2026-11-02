import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { PageHeader } from "@/components/ui/page-header";
import { Stat } from "@/components/ui/stat";
import { formatShopTime } from "@/lib/time";
import { formatEtb } from "@/lib/utils";
import { requirePage } from "@/lib/auth/access";
import { getDashboard } from "@/services/sales.service";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requirePage((ability) => ability.can("read", "Dashboard"));
  const data = await getDashboard();

  return (
    <div className="space-y-8">
      <PageHeader title="Today" description={`${data.today.label} · Addis Ababa`} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Today's revenue" value={formatEtb(data.today.revenue)} href="/admin/sales" />
        <Stat label="Today's sales" value={String(data.today.sales.length)} href="/admin/sales" />
        <Stat label="This month" value={formatEtb(data.monthRevenue)} href="/admin/reports" />
        <Stat label="Active items" value={String(data.skuCount)} href="/admin/inventory" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Link href="/admin/alerts" className="block">
          <Card className="h-full">
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">Needs attention</p>
            <p className="mt-3 font-display text-3xl">{data.outCount} sold out</p>
            <p className="mt-1 text-[var(--warn)]">{data.lowCount} low — still in stock, at or below the reorder level</p>
          </Card>
        </Link>
        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl">Latest sales</h2>
            <ButtonLink href="/admin/sales" variant="ghost" size="sm">
              Ledger
            </ButtonLink>
          </div>
          <div className="mt-3 divide-y divide-[var(--border)]">
            {data.recent.length === 0 && <Empty>No sales yet.</Empty>}
            {data.recent.map((sale) => (
              <Link key={sale.id} href={`/pos/receipt/${sale.id}`} className="flex items-baseline justify-between gap-3 py-3">
                <span>
                  <span className="font-medium">{sale.saleNumber}</span>
                  <span className="mt-0.5 block text-sm text-[var(--muted)]">
                    {formatShopTime(sale.createdAt)} · {sale.employee.name}
                  </span>
                </span>
                <span className="font-semibold">{formatEtb(Number(sale.total))}</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
