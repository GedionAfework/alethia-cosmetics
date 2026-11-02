"use client";

import { useActionState } from "react";
import { grantSuperAdminAction, transferSuperAdminAction } from "@/app/actions/access";
import type { ActionResult } from "@/lib/action-result";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SelectField, TextField } from "@/components/ui/fields";
import { Notice } from "@/components/ui/notice";

const initial: ActionResult = { ok: true };

type StaffOption = {
  id: string;
  name: string;
  telegramUsername: string | null;
  isSuperAdmin: boolean;
  roleName: string;
};

export function SuperAdminSettings({
  staff,
  currentUserId,
}: {
  staff: StaffOption[];
  currentUserId: string;
}) {
  const grantCandidates = staff.filter((person) => person.id !== currentUserId && !person.isSuperAdmin);
  const transferCandidates = staff.filter((person) => person.id !== currentUserId);
  const [grantState, grantAction, grantPending] = useActionState(grantSuperAdminAction, initial);
  const [transferState, transferAction, transferPending] = useActionState(transferSuperAdminAction, initial);

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <form action={grantAction}>
        <Card className="space-y-4">
          <div>
            <h2 className="font-display text-2xl">Grant Super Admin</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Add another Super Admin. You keep your access. Multiple Super Admins are allowed.
            </p>
          </div>
          <SelectField label="Staff member" name="targetId" required defaultValue={grantCandidates[0]?.id || ""}>
            {grantCandidates.length === 0 && <option value="">No eligible staff</option>}
            {grantCandidates.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
                {person.telegramUsername ? ` (@${person.telegramUsername})` : ""} · {person.roleName}
              </option>
            ))}
          </SelectField>
          {grantState.error && <Notice tone="danger">{grantState.error}</Notice>}
          <Button type="submit" disabled={grantPending || grantCandidates.length === 0}>
            {grantPending ? "Granting…" : "Grant Super Admin"}
          </Button>
        </Card>
      </form>

      <form action={transferAction}>
        <Card className="space-y-4">
          <div>
            <h2 className="font-display text-2xl">Hand off Super Admin</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Full transfer: they become Super Admin and you lose it. Type their Telegram username to confirm.
            </p>
          </div>
          <SelectField label="Hand off to" name="targetId" required defaultValue={transferCandidates[0]?.id || ""}>
            {transferCandidates.length === 0 && <option value="">No other staff</option>}
            {transferCandidates.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
                {person.telegramUsername ? ` (@${person.telegramUsername})` : ""}
                {person.isSuperAdmin ? " · already Super Admin" : ` · ${person.roleName}`}
              </option>
            ))}
          </SelectField>
          <TextField
            label="Confirm their Telegram username"
            name="confirmTelegramUsername"
            required
            placeholder="username"
            hint="Without @. Must match the person you selected."
          />
          {transferState.error && <Notice tone="danger">{transferState.error}</Notice>}
          <Button type="submit" variant="danger" disabled={transferPending || transferCandidates.length === 0}>
            {transferPending ? "Transferring…" : "Transfer Super Admin"}
          </Button>
        </Card>
      </form>
    </div>
  );
}
