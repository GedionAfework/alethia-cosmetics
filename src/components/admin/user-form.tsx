"use client";

import { useActionState } from "react";
import { createUserAction, updateUserAction } from "@/app/actions/access";
import type { ActionResult } from "@/lib/action-result";
import { useI18n } from "@/lib/i18n/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SelectField, SwitchField, TextField } from "@/components/ui/fields";
import { Notice } from "@/components/ui/notice";

const initial: ActionResult = { ok: true };

type RoleOption = { id: string; name: string };

export function UserForm({
  roles,
  user,
  actorIsSuperAdmin,
}: {
  roles: RoleOption[];
  actorIsSuperAdmin: boolean;
  user?: {
    id: string;
    name: string;
    username: string;
    roleId: string;
    telegramUsername: string;
    isActive: boolean;
    isSuperAdmin: boolean;
  };
}) {
  const { t, err } = useI18n();
  const action = user ? updateUserAction : createUserAction;
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-4">
      {user && <input type="hidden" name="id" value={user.id} />}
      <Card className="space-y-4">
        <TextField label={t.users.name} name="name" required defaultValue={user?.name} autoComplete="name" />
        <div className="relative">
          <TextField
            label={t.users.telegram}
            name="telegramUsername"
            required
            defaultValue={user?.telegramUsername}
            placeholder="username"
            autoCapitalize="none"
            autoCorrect="off"
            className="[&_input]:pl-9"
          />
          <span className="pointer-events-none absolute bottom-3 left-4 text-base font-semibold text-muted">@</span>
        </div>
        <SelectField label={t.users.role} name="roleId" required defaultValue={user?.roleId || roles[0]?.id || ""}>
          {roles.length === 0 && <option value="">{t.users.needRole}</option>}
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </SelectField>
      </Card>
      {(actorIsSuperAdmin || user) && (
        <Card className="space-y-2 p-2">
          {actorIsSuperAdmin && (
            <SwitchField name="isSuperAdmin" value="1" defaultChecked={Boolean(user?.isSuperAdmin)} label={t.users.superAdmin} />
          )}
          {user && <SwitchField name="isActive" value="1" defaultChecked={user.isActive} label={t.users.active} />}
        </Card>
      )}
      {user && (
        <p className="px-1 text-xs text-muted">
          {t.users.login}: <span className="font-semibold text-ink">{user.username}</span>
        </p>
      )}
      {state.error && <Notice tone="danger">{err(state.error)}</Notice>}
      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={pending || roles.length === 0}>
        {pending ? t.common.saving : user ? t.common.save : t.users.create}
      </Button>
    </form>
  );
}
