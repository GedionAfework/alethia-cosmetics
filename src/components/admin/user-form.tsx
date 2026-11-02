"use client";

import { useActionState } from "react";
import { createUserAction, updateUserAction } from "@/app/actions/access";
import type { ActionResult } from "@/lib/action-result";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckboxField, SelectField, TextField } from "@/components/ui/fields";
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
  const action = user ? updateUserAction : createUserAction;
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction}>
      <Card className="space-y-4">
        {user && <input type="hidden" name="id" value={user.id} />}
        <TextField label="Name" name="name" required defaultValue={user?.name} autoComplete="name" />
        <TextField
          label="Telegram username"
          name="telegramUsername"
          required
          defaultValue={user?.telegramUsername}
          placeholder="username"
          hint="Without @. They open the Mini App with this account to sign in."
        />
        {user && (
          <p className="text-sm text-[var(--muted)]">
            Internal login id: <span className="font-semibold text-[var(--ink)]">{user.username}</span>
          </p>
        )}
        <SelectField label="Role" name="roleId" required defaultValue={user?.roleId || roles[0]?.id || ""}>
          {roles.length === 0 && <option value="">Create a role first</option>}
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </SelectField>
        {actorIsSuperAdmin && (
          <CheckboxField
            name="isSuperAdmin"
            value="1"
            defaultChecked={Boolean(user?.isSuperAdmin)}
            label="Super Admin"
            hint="Can create roles and users, and grant or hand off Super Admin. Shop permissions still come from the role."
          />
        )}
        {user && (
          <CheckboxField name="isActive" value="1" defaultChecked={user.isActive} label="Active" hint="Inactive people cannot sign in." />
        )}
        {state.error && <Notice tone="danger">{state.error}</Notice>}
        <Button type="submit" disabled={pending || roles.length === 0}>
          {pending ? "Saving…" : user ? "Save user" : "Create user"}
        </Button>
      </Card>
    </form>
  );
}
