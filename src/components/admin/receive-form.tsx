"use client";

import { useActionState } from "react";
import { PackagePlus } from "lucide-react";
import { receiveStockAction } from "@/app/actions/inventory";
import type { ActionResult } from "@/lib/action-result";
import { useI18n } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SelectField, TextField } from "@/components/ui/fields";
import { Notice } from "@/components/ui/notice";

const initial: ActionResult = { ok: true };

export function ReceiveForm({
  products,
  selectedId,
}: {
  products: { id: string; name: string; sku: string; stockOnHand: number }[];
  selectedId?: string;
}) {
  const { t, err } = useI18n();
  const [state, formAction, pending] = useActionState(receiveStockAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      <Card className="space-y-4">
        <SelectField label={t.receive.product} name="productId" defaultValue={selectedId || ""} required>
          <option value="" disabled>
            {t.receive.choose}
          </option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} · {product.stockOnHand}
            </option>
          ))}
        </SelectField>
        <TextField
          label={t.receive.quantity}
          name="quantity"
          type="number"
          inputMode="numeric"
          min="1"
          step="1"
          required
          className="[&_input]:text-2xl [&_input]:font-bold [&_input]:h-16"
        />
        <TextField label={t.receive.note} name="note" placeholder={t.receive.notePlaceholder} />
      </Card>
      {state.error && <Notice tone="danger">{err(state.error)}</Notice>}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        <PackagePlus />
        {pending ? t.common.saving : t.receive.submit}
      </Button>
    </form>
  );
}
