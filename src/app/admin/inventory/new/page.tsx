import { createProductAction } from "@/app/actions/inventory";
import { ProductForm } from "@/components/admin/product-form";
import { PageHeader } from "@/components/ui/page-header";
import { requirePage } from "@/lib/auth/access";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requirePage((ability) => ability.can("manage", "Inventory"));
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        title="New product"
        description="Opening quantity is recorded as stock received, so the lifecycle starts from the first delivery."
      />
      <ProductForm action={createProductAction} />
    </div>
  );
}
