import { Receipt } from "lucide-react";
import { Empty } from "@/components/ui/empty";
import { IconTile, List, ListRow } from "@/components/ui/list";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { requirePage } from "@/lib/auth/access";
import { formatDateTime, formatMoney } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n/server";
import { salesTabs } from "@/lib/nav";
import { listEmployeeSales, listRecentSales } from "@/services/sales.service";

export const dynamic = "force-dynamic";

export default async function MySalesPage() {
  const access = await requirePage((ability) => ability.can("read", "Sale") || ability.can("read", "SalesLedger"));
  const seesAll = access.ability.can("read", "SalesLedger");
  const [{ t, locale }, sales] = await Promise.all([
    getI18n(),
    seesAll ? listRecentSales(40) : listEmployeeSales(access.user.id),
  ]);

  return (
    <div>
      <Tabs items={salesTabs(access.ability, t)} />
      <PageHeader title={seesAll ? t.sales.receiptsTitle : t.sales.mineTitle} />
      {sales.length === 0 ? (
        <Empty icon={Receipt}>{t.sales.noSales}</Empty>
      ) : (
        <List>
          {sales.map((sale) => (
            <ListRow
              key={sale.id}
              href={`/pos/receipt/${sale.id}`}
              leading={<IconTile icon={Receipt} tone="muted" />}
              title={sale.saleNumber}
              subtitle={`${formatDateTime(sale.createdAt, locale)} · ${sale.itemCount}×${seesAll ? ` · ${sale.employee.name}` : ""}`}
              trailing={<span className="tabular font-bold">{formatMoney(Number(sale.total), locale)}</span>}
            />
          ))}
        </List>
      )}
    </div>
  );
}
