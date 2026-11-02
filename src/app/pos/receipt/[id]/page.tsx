import { notFound, redirect } from "next/navigation";
import { subject } from "@casl/ability";
import { PrintButton } from "@/components/pos/print-button";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { loadAccess } from "@/lib/auth/access";
import { formatEtb } from "@/lib/utils";
import { formatShopDateTime } from "@/lib/time";
import { getSale } from "@/services/sales.service";

export const dynamic = "force-dynamic";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await loadAccess();
  if (!access) redirect("/login");
  const sale = await getSale(id);
  if (!sale) notFound();
  const ownSale = sale.employeeId === access.user.id;
  const allowed =
    access.ability.can("read", "SalesLedger") ||
    access.ability.can("read", subject("Sale", { employeeId: sale.employeeId })) ||
    (ownSale && access.ability.can("create", "Sale"));
  if (!allowed) notFound();

  return (
    <div className="mx-auto max-w-md">
      <div className="no-print mb-4 flex gap-3">
        <PrintButton />
        <ButtonLink href="/pos" variant="secondary">
          New sale
        </ButtonLink>
      </div>
      <Card className="bg-white p-6">
        <p className="text-center text-xs tracking-[0.16em] uppercase text-[var(--muted)]">Aletheia</p>
        <h1 className="text-center font-display text-3xl">Cosmo & Gift</h1>
        <p className="mt-4 text-center text-sm">{sale.saleNumber}</p>
        <p className="text-center text-sm text-[var(--muted)]">{formatShopDateTime(sale.createdAt)}</p>
        <p className="text-center text-sm text-[var(--muted)]">Served by {sale.employee.name}</p>
        <div className="mt-5 space-y-3 border-t border-dashed border-[var(--border)] pt-4 text-sm">
          {sale.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-3">
              <span>
                {item.productName}
                <span className="block text-[var(--muted)]">
                  {item.quantity} × {formatEtb(Number(item.unitPrice))}
                </span>
              </span>
              <span>{formatEtb(Number(item.subtotal))}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-end justify-between border-t border-dashed border-[var(--border)] pt-4">
          <span>Total</span>
          <span className="font-display text-3xl">{formatEtb(Number(sale.total))}</span>
        </div>
        <p className="mt-6 text-center text-sm text-[var(--muted)]">Thank you.</p>
      </Card>
    </div>
  );
}
