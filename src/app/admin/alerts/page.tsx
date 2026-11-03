import { CircleCheck, PackagePlus, PackageX, TriangleAlert } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { SectionTitle } from "@/components/ui/card";
import { IconTile, List, ListRow } from "@/components/ui/list";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { requirePage } from "@/lib/auth/access";
import { getI18n } from "@/lib/i18n/server";
import { stockTabs } from "@/lib/nav";
import { stockAlertLists } from "@/services/inventory.service";

export const dynamic = "force-dynamic";

function AllClear({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-3xl bg-ok-soft px-4 py-4 text-sm font-semibold text-ok">
      <CircleCheck className="size-5" />
      {children}
    </div>
  );
}

export default async function AlertsPage() {
  const access = await requirePage((ability) => ability.can("read", "Alert"));
  const [{ t, fmt }, { out, low }] = await Promise.all([getI18n(), stockAlertLists()]);
  const canReceive = access.ability.can("create", "StockReceipt");

  function receiveButton(id: string) {
    if (!canReceive) return null;
    return (
      <ButtonLink href={`/admin/receive?product=${id}`} variant="soft" size="icon" aria-label={t.nav.receive}>
        <PackagePlus />
      </ButtonLink>
    );
  }

  return (
    <div>
      <Tabs items={stockTabs(access.ability, t)} />
      <PageHeader title={t.alerts.title} />

      <section className="mb-8">
        <SectionTitle>
          {t.alerts.out} · {out.length}
        </SectionTitle>
        {out.length === 0 ? (
          <AllClear>{t.alerts.noneOut}</AllClear>
        ) : (
          <List>
            {out.map((product) => (
              <ListRow
                key={product.id}
                leading={<IconTile icon={PackageX} tone="danger" />}
                title={product.name}
                subtitle={product.sku}
                trailing={receiveButton(product.id)}
              />
            ))}
          </List>
        )}
      </section>

      <section>
        <SectionTitle>
          {t.alerts.low} · {low.length}
        </SectionTitle>
        {low.length === 0 ? (
          <AllClear>{t.alerts.noneLow}</AllClear>
        ) : (
          <List>
            {low.map((product) => (
              <ListRow
                key={product.id}
                leading={<IconTile icon={TriangleAlert} tone="warn" />}
                title={product.name}
                subtitle={`${fmt(t.alerts.left, { n: product.stockOnHand })} · ${fmt(t.alerts.reorderAt, { n: product.reorderLevel })}`}
                trailing={receiveButton(product.id)}
              />
            ))}
          </List>
        )}
      </section>
    </div>
  );
}
