"use client";

import { useActionState } from "react";
import { receiveStockAction } from "@/app/actions/inventory";
import type { ActionResult } from "@/lib/action-result";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SelectField, TextField } from "@/components/ui/fields";
import { Notice } from "@/components/ui/notice";

const initial: ActionResult = { ok: true };

export function ReceiveForm({
  products,
  selectedId,
}: {
  products: { id: string; name: string; sku: string }[];
  selectedId?: string;
}) {
  const [state, formAction, pending] = useActionState(receiveStockAction, initial);

  return (
    <form action={formAction}>
      <Card className="space-y-4">
        <SelectField label="Product" name="productId" defaultValue={selectedId || ""} required>
          <option value="" disabled>
            Choose an item
          </option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} · {product.sku}
            </option>
          ))}
        </SelectField>
        <TextField label="Quantity received" name="quantity" type="number" min="1" step="1" required />
        <TextField label="Note" name="note" placeholder="Supplier, invoice, or delivery" />
        {state.error && <Notice tone="danger">{state.error}</Notice>}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Add to stock"}
        </Button>
      </Card>
    </form>
  );
}
