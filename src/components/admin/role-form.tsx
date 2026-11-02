"use client";

import { useActionState } from "react";
import { updateRoleAction, createRoleAction } from "@/app/actions/access";
import type { ActionResult } from "@/lib/action-result";
import { permissionsByGroup } from "@/lib/auth/permissions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckboxField, TextAreaField, TextField } from "@/components/ui/fields";
import { Notice } from "@/components/ui/notice";

const initial: ActionResult = { ok: true };

export function RoleForm({
  role,
}: {
  role?: { id: string; name: string; description: string; permissions: string[] };
}) {
  const action = role ? updateRoleAction : createRoleAction;
  const [state, formAction, pending] = useActionState(action, initial);
  const selected = new Set(role?.permissions ?? []);

  return (
    <form action={formAction} className="space-y-5">
      {role && <input type="hidden" name="id" value={role.id} />}
      <Card className="space-y-4">
        <TextField label="Role name" name="name" required defaultValue={role?.name} placeholder="Cashier" />
        <TextAreaField
          label="Description"
          name="description"
          defaultValue={role?.description}
          hint="A short note so you remember who this role is for."
          rows={3}
        />
      </Card>
      <Card className="space-y-5">
        <div>
          <h2 className="font-display text-2xl">Permissions</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Choose what someone with this role is allowed to do.</p>
        </div>
        {permissionsByGroup().map((group) => (
          <fieldset key={group.group} className="space-y-2">
            <legend className="mb-2 text-xs font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
              {group.group}
            </legend>
            <div className="grid gap-2">
              {group.items.map((item) => (
                <CheckboxField
                  key={item.code}
                  boxed
                  name="permissions"
                  value={item.code}
                  label={item.label}
                  hint={item.description}
                  defaultChecked={selected.has(item.code)}
                />
              ))}
            </div>
          </fieldset>
        ))}
      </Card>
      {state.error && <Notice tone="danger">{state.error}</Notice>}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : role ? "Save role" : "Create role"}
      </Button>
    </form>
  );
}
