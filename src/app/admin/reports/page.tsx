import { ChevronLeft, ChevronRight, Layers, ShoppingBag, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, SectionTitle } from "@/components/ui/card";
import { ExportButtons } from "@/components/ui/export-buttons";
import { List, ListRow } from "@/components/ui/list";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Tabs } from "@/components/ui/tabs";
import { requirePage } from "@/lib/auth/access";
import { formatCompact, formatMoney, monthName } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n/server";
import { salesTabs } from "@/lib/nav";
import { shopMonthIndex, shopYear } from "@/lib/time";
import { cn } from "@/lib/utils";
import { getMonthlyReport } from "@/services/sales.service";

export const dynamic = "force-dynamic";

function ChangeBadge({ change }: { change: number | null }) {
  if (change == null || change === 0) return null;
  const up = change > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <Badge tone={up ? "ok" : "out"} className="gap-1 px-2 py-0.5 text-[11px]">
      <Icon className="size-3" />
      {`${up ? "+" : ""}${change.toFixed(0)}%`}
    </Badge>
  );
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const access = await requirePage((ability) => ability.can("read", "Report"));
  const { year: yearParam } = await searchParams;
  const requested = Number(yearParam || shopYear());
  const year = Number.isInteger(requested) && requested >= 2020 && requested <= 2100 ? requested : shopYear();
  const [{ t, locale }, report] = await Promise.all([getI18n(), getMonthlyReport(year)]);
  const money = (value: number) => formatMoney(value, locale);
  const max = Math.max(...report.rows.map((row) => row.revenue), 0);
  const peak = max > 0 ? report.rows.findIndex((row) => row.revenue === max) : -1;
  const currentMonth = year === shopYear() ? shopMonthIndex() : -1;
  const thisYear = shopYear();

  return (
    <div>
      <Tabs items={salesTabs(access.ability, t)} />
      <PageHeader
        title={t.sales.monthlyTitle}
        actions={
          <ExportButtons base={`/api/reports/monthly?year=${year}`} labels={{ excel: t.common.excel, pdf: t.common.pdf }} />
        }
      />

      <div className="mb-5 flex items-center gap-2">
        <ButtonLink href={`/admin/reports?year=${year - 1}`} variant="secondary" size="icon" aria-label={String(year - 1)}>
          <ChevronLeft />
        </ButtonLink>
        <span className="tabular min-w-20 text-center text-xl font-bold">{year}</span>
        {year < thisYear ? (
          <ButtonLink href={`/admin/reports?year=${year + 1}`} variant="secondary" size="icon" aria-label={String(year + 1)}>
            <ChevronRight />
          </ButtonLink>
        ) : (
          <span className="size-10" />
        )}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard highlight icon={Wallet} label={t.common.revenue} value={money(report.revenue)} className="col-span-2 sm:col-span-1" />
        <StatCard icon={ShoppingBag} label={t.common.sales} value={String(report.sales)} />
        <StatCard icon={Layers} tone="ok" label={t.common.units} value={String(report.units)} />
      </div>

      <Card className="mb-8 px-3 pt-8 pb-4 sm:px-5">
        <div className="flex h-56 items-end gap-[2px] sm:gap-2" role="img" aria-label={`${t.sales.monthlyTitle} ${year}`}>
          {report.rows.map((row, index) => {
            const height = row.revenue <= 0 || max <= 0 ? 0 : Math.max(3, (row.revenue / max) * 100);
            return (
              <div key={row.month} className="group relative flex h-full flex-1 flex-col items-center justify-end gap-2">
                {/* Hover tooltip */}
                <div className="pointer-events-none absolute bottom-full z-10 mb-1 hidden -translate-y-1 rounded-xl bg-ink px-2.5 py-1.5 text-center text-xs whitespace-nowrap text-canvas shadow-lg group-hover:block">
                  <p className="font-semibold">{monthName(index, locale)}</p>
                  <p className="tabular">{money(row.revenue)}</p>
                </div>
                <div className="relative flex w-full flex-1 items-end justify-center">
                  {index === peak && (
                    <span
                      className="tabular absolute left-1/2 -translate-x-1/2 text-[10px] font-bold text-ink"
                      style={{ bottom: `calc(${height}% + 4px)` }}
                    >
                      {formatCompact(row.revenue)}
                    </span>
                  )}
                  <div
                    className={cn(
                      "w-full max-w-9 rounded-t-[4px] bg-accent transition group-hover:brightness-110",
                      height === 0 && "h-[2px] rounded-none bg-line"
                    )}
                    style={height > 0 ? { height: `${height}%` } : undefined}
                  />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase",
                    index === currentMonth ? "text-accent" : "text-muted"
                  )}
                >
                  {monthName(index, locale, "short").slice(0, 3)}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <SectionTitle>{year}</SectionTitle>
      <List>
        {report.rows.map((row, index) => (
          <ListRow
            key={row.month}
            title={monthName(index, locale)}
            subtitle={`${row.sales} ${t.common.sales} · ${row.units} ${t.common.units}`}
            trailing={
              <div className="flex flex-col items-end gap-1">
                <span className="tabular font-bold">{money(row.revenue)}</span>
                <ChangeBadge change={row.change} />
              </div>
            }
          />
        ))}
      </List>
    </div>
  );
}
