import Link from "next/link";
import { CalendarDays, CircleCheck, Package, Receipt, ShoppingBag, TriangleAlert, Wallet } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { SectionTitle } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { IconTile, List, ListRow } from "@/components/ui/list";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { requirePage } from "@/lib/auth/access";
import { formatLongDate, formatMoney, formatTime } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n/server";
import { getDashboard } from "@/services/sales.service";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const access = await requirePage((ability) => ability.can("read", "Dashboard"));
  const [{ t, locale, fmt }, data] = await Promise.all([getI18n(), getDashboard()]);
  const money = (value: number) => formatMoney(value, locale);
  const firstName = access.user.name.split(/\s+/)[0];
  const canAlerts = access.ability.can("read", "Alert");
  const allGood = data.outCount === 0 && data.lowCount === 0;

  return (
    <div className="space-y-8">
      <PageHeader eyebrow={formatLongDate(data.today.label, locale)} title={fmt(t.dashboard.greeting, { name: firstName })} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          highlight
          icon={Wallet}
          label={t.dashboard.revenue}
          value={money(data.today.revenue)}
          href="/admin/sales"
          className="animate-rise"
        />
        <StatCard icon={ShoppingBag} label={t.dashboard.salesToday} value={String(data.today.sales.length)} href="/admin/sales" className="animate-rise" />
        <StatCard icon={CalendarDays} tone="ok" label={t.dashboard.month} value={money(data.monthRevenue)} href="/admin/reports" className="animate-rise" />
        <StatCard icon={Package} tone="warn" label={t.dashboard.activeItems} value={String(data.skuCount)} href="/admin/inventory" className="animate-rise" />
      </div>

      <section>
        <SectionTitle>{t.dashboard.attention}</SectionTitle>
        {allGood ? (
          <div className="flex items-center gap-3 rounded-3xl bg-ok-soft px-4 py-4 font-semibold text-ok">
            <CircleCheck className="size-5" />
            {t.dashboard.allGood}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: t.dashboard.soldOut, value: data.outCount, tone: "danger" as const },
              { label: t.dashboard.low, value: data.lowCount, tone: "warn" as const },
            ].map((item) => {
              const body = (
                <div className="flex items-center gap-3 rounded-3xl bg-surface p-4 ring-1 ring-line shadow-[var(--shadow)] transition hover:-translate-y-0.5">
                  <IconTile icon={TriangleAlert} tone={item.tone} />
                  <div>
                    <p className="tabular text-2xl font-bold">{item.value}</p>
                    <p className="text-[13px] font-medium text-muted">{item.label}</p>
                  </div>
                </div>
              );
              return canAlerts ? (
                <Link key={item.label} href="/admin/alerts" className="block rounded-3xl">
                  {body}
                </Link>
              ) : (
                <div key={item.label}>{body}</div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <SectionTitle
          action={
            <ButtonLink href="/admin/sales" variant="ghost" size="sm">
              {t.common.viewAll}
            </ButtonLink>
          }
        >
          {t.dashboard.latest}
        </SectionTitle>
        {data.recent.length === 0 ? (
          <Empty icon={Receipt}>{t.dashboard.noSales}</Empty>
        ) : (
          <List>
            {data.recent.map((sale) => (
              <ListRow
                key={sale.id}
                href={`/pos/receipt/${sale.id}`}
                chevron={false}
                leading={<IconTile icon={Receipt} tone="muted" />}
                title={sale.saleNumber}
                subtitle={`${formatTime(sale.createdAt, locale)} · ${sale.employee.name}`}
                trailing={<span className="tabular font-bold">{money(Number(sale.total))}</span>}
              />
            ))}
          </List>
        )}
      </section>
    </div>
  );
}
