"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/lib/action-result";
import { CATEGORIES } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckboxField, SelectField, TextAreaField, TextField } from "@/components/ui/fields";
import { Notice } from "@/components/ui/notice";

const initial: ActionResult = { ok: true };

type ProductValues = {
  id?: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  description: string;
  unitPrice: string;
  reorderLevel: number;
  isActive: boolean;
};

export function ProductForm({
  action,
  product,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  product?: ProductValues;
}) {
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction}>
      <Card className="space-y-4">
        {product?.id && <input type="hidden" name="id" value={product.id} />}
        <TextField label="Name" name="name" defaultValue={product?.name} required />
        <SelectField label="Category" name="category" defaultValue={product?.category || "COSMETICS"}>
          {CATEGORIES.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </SelectField>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="SKU"
            name="sku"
            defaultValue={product?.sku}
            placeholder="Auto if empty"
            hint={product ? undefined : "Leave blank and one will be created."}
          />
          <TextField label="Barcode" name="barcode" defaultValue={product?.barcode} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Retail price (ETB)"
            name="unitPrice"
            type="number"
            min="0.01"
            step="0.01"
            defaultValue={product?.unitPrice}
            required
          />
          <TextField
            label="Reorder level"
            name="reorderLevel"
            type="number"
            min="0"
            step="1"
            defaultValue={product?.reorderLevel ?? 5}
            required
            hint="You'll be warned when stock falls to this number."
          />
        </div>
        <TextAreaField label="Description" name="description" defaultValue={product?.description} rows={3} />
        {!product && (
          <TextField label="Opening quantity received" name="openingQty" type="number" min="0" step="1" defaultValue="0" />
        )}
        {product && (
          <>
            <CheckboxField name="isActive" value="1" defaultChecked={product.isActive} label="Available for sale" />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Stock correction (+/−)" name="adjustment" type="number" step="1" defaultValue="0" />
              <TextField
                label="Correction note"
                name="adjustmentNote"
                placeholder="Count was short by 2"
                hint="Required if you correct stock."
              />
            </div>
          </>
        )}
        {state.error && <Notice tone="danger">{state.error}</Notice>}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : product ? "Save changes" : "Add product"}
        </Button>
      </Card>
    </form>
  );
}
