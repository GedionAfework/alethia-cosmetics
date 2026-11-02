import { Button, ButtonAnchor } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TextField } from "@/components/ui/fields";
import { PageHeader } from "@/components/ui/page-header";
import { requirePage } from "@/lib/auth/access";
import { shopYear } from "@/lib/time";
import { formatEtb } from "@/lib/utils";
import { getMonthlyReport } from "@/services/sales.service";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  await requirePage((ability) => ability.can("read", "Report"));
  const { year: yearParam } = await searchParams;
  const requested = Number(yearParam || shopYear());
  const year = Number.isInteger(requested) && requested >= 2020 && requested <= 2100 ? requested : shopYear();
  const report = await getMonthlyReport(year);
  const max = Math.max(...report.rows.map((row) => row.revenue), 1);

  return (
    <div>
      <PageHeader
        title="Monthly"
        description={`${report.sales} sales · ${report.units} units · ${formatEtb(report.revenue)}`}
        actions={
          <>
            <ButtonAnchor href={`/api/reports/monthly?year=${year}&format=xls`}>Excel</ButtonAnchor>
            <ButtonAnchor href={`/api/reports/monthly?year=${year}&format=pdf`}>PDF</ButtonAnchor>
          </>
        }
      />

      <form className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end" action="/admin/reports">
        <TextField
          label="Year"
          type="number"
          name="year"
          min={2020}
          max={2100}
          defaultValue={year}
          className="w-36"
        />
        <Button type="submit" variant="secondary">
          Show
        </Button>
      </form>

      <Card className="mt-6">
        <div className="flex h-52 items-end gap-1 sm:gap-2">
          {report.rows.map((row) => {
            const height = row.revenue <= 0 ? 0 : Math.max(6, (row.revenue / max) * 100);
            return (
              <div key={row.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <div
                  className="w-full rounded-t-md bg-[var(--accent)]"
                  style={{ height: `${height}%` }}
                  title={`${row.label}: ${formatEtb(row.revenue)}`}
                />
                <span className="text-[10px] uppercase text-[var(--muted)]">{row.label.slice(0, 3)}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="mt-6 divide-y divide-[var(--border)]">
        {report.rows.map((row) => (
          <div key={row.label} className="grid grid-cols-2 gap-2 py-3 text-sm sm:grid-cols-4">
            <p className="font-semibold">{row.label}</p>
            <p>{row.sales} sales</p>
            <p>{row.units} units</p>
            <p className="sm:text-right">
              {formatEtb(row.revenue)}
              <span className="ml-2 text-[var(--muted)]">{changeLabel(row.change)}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function changeLabel(change: number | null) {
  if (change == null) return "";
  if (change === 0) return "0%";
  const sign = change > 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
}
