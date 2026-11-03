import { createProductAction } from "@/app/actions/inventory";
import { ProductForm } from "@/components/admin/product-form";
import { PageHeader } from "@/components/ui/page-header";
import { requirePage } from "@/lib/auth/access";
import { getI18n } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requirePage((ability) => ability.can("manage", "Inventory"));
  const { t } = await getI18n();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t.inventory.newTitle} back={{ href: "/admin/inventory", label: t.inventory.title }} />
      <ProductForm action={createProductAction} />
    </div>
  );
}
