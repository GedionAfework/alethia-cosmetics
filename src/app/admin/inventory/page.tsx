import Link from "next/link";
import { Package, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Empty } from "@/components/ui/empty";
import { SearchInput } from "@/components/ui/fields";
import { List, ListRow } from "@/components/ui/list";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { requirePage } from "@/lib/auth/access";
import { CATEGORIES, isCategory, stockTone } from "@/lib/catalog";
import { formatMoney } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n/server";
import { stockTabs } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { listProducts } from "@/services/inventory.service";

export const dynamic = "force-dynamic";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; archived?: string; notice?: string }>;
}) {
  const access = await requirePage((ability) => ability.can("read", "Inventory"));
  const params = await searchParams;
  const { t, locale } = await getI18n();
  const canManage = access.ability.can("manage", "Inventory");
  const category = params.category && isCategory(params.category) ? params.category : undefined;
  const archived = params.archived === "1";
  const products = await listProducts({ q: params.q, category, includeArchived: archived });

  const notices: Record<string, string> = {
    received: t.inventory.noticeReceived,
    archived: t.inventory.noticeArchived,
    deleted: t.inventory.noticeDeleted,
  };

  function chipHref(next: { category?: string; archived?: boolean }) {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (next.category) query.set("category", next.category);
    if (next.archived) query.set("archived", "1");
    const qs = query.toString();
    return qs ? `/admin/inventory?${qs}` : "/admin/inventory";
  }

  const chips = [
    { label: t.common.all, href: chipHref({ archived }), active: !category },
    ...CATEGORIES.map((value) => ({
      label: t.categories[value],
      href: chipHref({ category: value, archived }),
      active: category === value,
    })),
    { label: t.inventory.showArchived, href: chipHref({ category, archived: !archived }), active: archived },
  ];

  return (
    <div>
      <Tabs items={stockTabs(access.ability, t)} />
      <PageHeader
        title={t.inventory.title}
        actions={
          canManage ? (
            <ButtonLink href="/admin/inventory/new">
              <Plus />
              {t.inventory.add}
            </ButtonLink>
          ) : undefined
        }
      />

      {params.notice && notices[params.notice] && <Notice tone="ok" className="mb-4">{notices[params.notice]}</Notice>}

      <form action="/admin/inventory" className="mb-3">
        {category && <input type="hidden" name="category" value={category} />}
        {archived && <input type="hidden" name="archived" value="1" />}
        <SearchInput name="q" defaultValue={params.q || ""} placeholder={t.inventory.search} aria-label={t.common.search} />
      </form>

      <div className="scrollbar-none -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {chips.map((chip) => (
          <Link
            key={chip.label}
            href={chip.href}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
              chip.active
                ? "bg-accent text-on-accent ring-accent shadow-[0_6px_16px_-8px_var(--accent)]"
                : "bg-surface text-muted ring-line hover:text-ink"
            )}
          >
            {chip.label}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <Empty icon={Package}>{t.inventory.empty}</Empty>
      ) : (
        <List>
          {products.map((product) => {
            const tone = stockTone(product.stockOnHand, product.reorderLevel);
            return (
              <ListRow
                key={product.id}
                href={canManage ? `/admin/inventory/${product.id}` : undefined}
                leading={<CategoryIcon category={product.category} muted={!product.isActive} />}
                title={product.name}
                subtitle={`${formatMoney(Number(product.unitPrice), locale)} · ${product.sku}`}
                trailing={
                  <div className="flex flex-col items-end gap-1">
                    <span className="tabular text-lg leading-none font-bold">{product.stockOnHand}</span>
                    {product.isActive ? (
                      <Badge tone={tone} dot className="px-2 py-0.5 text-[11px]">
                        {t.stockStatus[tone]}
                      </Badge>
                    ) : (
                      <Badge className="px-2 py-0.5 text-[11px]">{t.common.archived}</Badge>
                    )}
                  </div>
                }
              />
            );
          })}
        </List>
      )}
    </div>
  );
}
