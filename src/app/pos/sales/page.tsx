import Link from "next/link";
import { Empty } from "@/components/ui/empty";
import { PageHeader } from "@/components/ui/page-header";
import { requirePage } from "@/lib/auth/access";
import { formatEtb } from "@/lib/utils";
import { formatShopDateTime } from "@/lib/time";
import { listEmployeeSales, listRecentSales } from "@/services/sales.service";

export const dynamic = "force-dynamic";

export default async function MySalesPage() {
  const access = await requirePage(
    (ability) => ability.can("read", "Sale") || ability.can("read", "SalesLedger")
  );
  const seesAll = access.ability.can("read", "SalesLedger");
  const sales = seesAll ? await listRecentSales(40) : await listEmployeeSales(access.user.id);

  return (
    <div>
      <PageHeader
        title={seesAll ? "Recent sales" : "My sales"}
        description="Open a sale to print the receipt again."
      />
      <div className="mt-6 divide-y divide-[var(--border)]">
        {sales.length === 0 && <Empty>No sales yet.</Empty>}
        {sales.map((sale) => (
          <Link key={sale.id} href={`/pos/receipt/${sale.id}`} className="flex items-baseline justify-between gap-3 py-4">
            <span>
              <span className="font-semibold">{sale.saleNumber}</span>
              <span className="mt-0.5 block text-sm text-[var(--muted)]">
                {formatShopDateTime(sale.createdAt)} · {sale.itemCount} units
                {seesAll ? ` · ${sale.employee.name}` : ""}
              </span>
            </span>
            <span className="font-semibold">{formatEtb(Number(sale.total))}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
