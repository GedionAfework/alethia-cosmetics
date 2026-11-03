"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/lib/action-result";
import { CATEGORIES } from "@/lib/catalog";
import { useI18n } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SelectField, SwitchField, TextAreaField, TextField } from "@/components/ui/fields";
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
  const { t, err } = useI18n();
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-4">
      {product?.id && <input type="hidden" name="id" value={product.id} />}
      <Card className="space-y-4">
        <TextField label={t.inventory.name} name="name" defaultValue={product?.name} required />
        <SelectField label={t.inventory.category} name="category" defaultValue={product?.category || "COSMETICS"}>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {t.categories[category]}
            </option>
          ))}
        </SelectField>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={t.inventory.unitPrice}
            name="unitPrice"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            defaultValue={product?.unitPrice}
            required
          />
          <TextField
            label={t.inventory.reorderLevel}
            name="reorderLevel"
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            defaultValue={product?.reorderLevel ?? 5}
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label={t.inventory.sku} name="sku" defaultValue={product?.sku} placeholder={t.inventory.skuAuto} />
          <TextField label={t.inventory.barcode} name="barcode" defaultValue={product?.barcode} inputMode="numeric" />
        </div>
        {!product && (
          <TextField
            label={t.inventory.openingQty}
            name="openingQty"
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            defaultValue="0"
          />
        )}
        <TextAreaField label={t.inventory.description} name="description" defaultValue={product?.description} rows={2} />
      </Card>

      {product && (
        <Card className="space-y-4">
          <SwitchField name="isActive" value="1" defaultChecked={product.isActive} label={t.inventory.available} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label={t.inventory.adjustment} name="adjustment" type="number" step="1" defaultValue="0" />
            <TextField label={t.inventory.adjustmentNote} name="adjustmentNote" />
          </div>
        </Card>
      )}

      {state.error && <Notice tone="danger">{err(state.error)}</Notice>}
      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={pending}>
        {pending ? t.common.saving : product ? t.inventory.submitEdit : t.inventory.submitNew}
      </Button>
    </form>
  );
}
