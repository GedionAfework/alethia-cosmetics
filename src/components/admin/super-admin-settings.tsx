"use client";

import { useActionState } from "react";
import { ArrowRightLeft, Crown } from "lucide-react";
import { grantSuperAdminAction, transferSuperAdminAction } from "@/app/actions/access";
import type { ActionResult } from "@/lib/action-result";
import { useI18n } from "@/lib/i18n/client";
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

function label(person: StaffOption) {
  return `${person.name}${person.telegramUsername ? ` · @${person.telegramUsername}` : ""}`;
}

export function SuperAdminSettings({ staff, currentUserId }: { staff: StaffOption[]; currentUserId: string }) {
  const { t, err } = useI18n();
  const grantCandidates = staff.filter((person) => person.id !== currentUserId && !person.isSuperAdmin);
  const transferCandidates = staff.filter((person) => person.id !== currentUserId);
  const [grantState, grantAction, grantPending] = useActionState(grantSuperAdminAction, initial);
  const [transferState, transferAction, transferPending] = useActionState(transferSuperAdminAction, initial);

  return (
    <div className="grid gap-4">
      <form action={grantAction}>
        <Card className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Crown className="size-5 text-warn" />
            {t.admins.grant}
          </h2>
          <SelectField label={t.admins.person} name="targetId" required defaultValue={grantCandidates[0]?.id || ""}>
            {grantCandidates.length === 0 && <option value="">{t.admins.noEligible}</option>}
            {grantCandidates.map((person) => (
              <option key={person.id} value={person.id}>
                {label(person)}
              </option>
            ))}
          </SelectField>
          {grantState.error && <Notice tone="danger">{err(grantState.error)}</Notice>}
          <Button type="submit" className="w-full" disabled={grantPending || grantCandidates.length === 0}>
            {grantPending ? t.common.saving : t.admins.grantSubmit}
          </Button>
        </Card>
      </form>

      <form action={transferAction}>
        <Card className="space-y-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <ArrowRightLeft className="size-5 text-danger" />
              {t.admins.handoff}
            </h2>
            <p className="mt-1 text-sm font-medium text-danger">{t.admins.handoffWarning}</p>
          </div>
          <SelectField label={t.admins.person} name="targetId" required defaultValue={transferCandidates[0]?.id || ""}>
            {transferCandidates.length === 0 && <option value="">{t.admins.noEligible}</option>}
            {transferCandidates.map((person) => (
              <option key={person.id} value={person.id}>
                {label(person)}
              </option>
            ))}
          </SelectField>
          <TextField
            label={t.admins.confirm}
            name="confirmTelegramUsername"
            required
            placeholder="username"
            autoCapitalize="none"
            autoCorrect="off"
          />
          {transferState.error && <Notice tone="danger">{err(transferState.error)}</Notice>}
          <Button type="submit" variant="danger" className="w-full" disabled={transferPending || transferCandidates.length === 0}>
            {transferPending ? t.common.saving : t.admins.handoffSubmit}
          </Button>
        </Card>
      </form>
    </div>
  );
}
