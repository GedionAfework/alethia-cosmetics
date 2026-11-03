"use client";

import { useActionState } from "react";
import { createRoleAction, updateRoleAction } from "@/app/actions/access";
import type { ActionResult } from "@/lib/action-result";
import { permissionsByGroup } from "@/lib/auth/permissions";
import { useI18n } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import { Card, SectionTitle } from "@/components/ui/card";
import { SwitchField, TextField } from "@/components/ui/fields";
import { Notice } from "@/components/ui/notice";

const initial: ActionResult = { ok: true };

export function RoleForm({
  role,
}: {
  role?: { id: string; name: string; description: string; permissions: string[] };
}) {
  const { t, err } = useI18n();
  const action = role ? updateRoleAction : createRoleAction;
  const [state, formAction, pending] = useActionState(action, initial);
  const selected = new Set(role?.permissions ?? []);
  const labels = t.permissions.labels as Record<string, string>;
  const groups = t.permissions.groups as Record<string, string>;

  return (
    <form action={formAction} className="space-y-6">
      {role && <input type="hidden" name="id" value={role.id} />}
      <input type="hidden" name="description" value={role?.description ?? ""} />
      <Card>
        <TextField label={t.roles.name} name="name" required defaultValue={role?.name} />
      </Card>

      <div className="space-y-5">
        <h2 className="px-1 text-lg font-bold">{t.roles.permissions}</h2>
        {permissionsByGroup().map((group) => (
          <fieldset key={group.group}>
            <SectionTitle className="mb-2">{groups[group.group] ?? group.group}</SectionTitle>
            <div className="space-y-2">
              {group.items.map((item) => (
                <SwitchField
                  key={item.code}
                  name="permissions"
                  value={item.code}
                  label={labels[item.code] ?? item.label}
                  defaultChecked={selected.has(item.code)}
                  className="bg-surface ring-1 ring-line"
                />
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      {state.error && <Notice tone="danger">{err(state.error)}</Notice>}
      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={pending}>
        {pending ? t.common.saving : role ? t.common.save : t.roles.create}
      </Button>
    </form>
  );
}
