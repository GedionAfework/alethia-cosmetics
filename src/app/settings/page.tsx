import { Crown, KeyRound, LogOut, Users } from "lucide-react";
import { ThemePicker, LanguagePicker } from "@/components/settings/preference-pickers";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, SectionTitle } from "@/components/ui/card";
import { IconTile, List, ListRow } from "@/components/ui/list";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { requirePage } from "@/lib/auth/access";
import { getI18n } from "@/lib/i18n/server";
import { teamCounts } from "@/services/access.service";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const access = await requirePage(() => true);
  const { notice } = await searchParams;
  const { t } = await getI18n();
  const { user, ability } = access;
  const canUsers = ability.can("manage", "User");
  const canRoles = ability.can("manage", "Role");
  const canAdmins = ability.can("manage", "Settings") && user.isSuperAdmin;
  const counts = canUsers || canRoles || canAdmins ? await teamCounts() : null;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader title={t.settings.title} />

      {notice === "handed-off" && <Notice tone="ok">{t.settings.handedOff}</Notice>}

      <Card className="flex items-center gap-4">
        <Avatar name={user.name} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold">{user.name}</p>
          <p className="truncate text-sm text-muted">@{user.telegramUsername || user.username}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {user.isSuperAdmin && (
              <Badge tone="accent">
                <Crown className="size-3" />
                {t.common.superAdmin}
              </Badge>
            )}
            <Badge>{user.roleName}</Badge>
          </div>
        </div>
      </Card>

      <section>
        <SectionTitle>{t.settings.appearance}</SectionTitle>
        <ThemePicker />
      </section>

      <section>
        <SectionTitle>{t.settings.language}</SectionTitle>
        <LanguagePicker />
      </section>

      {counts && (
        <section>
          <SectionTitle>{t.settings.team}</SectionTitle>
          <List>
            {canUsers && (
              <ListRow
                href="/settings/users"
                leading={<IconTile icon={Users} />}
                title={t.settings.users}
                trailing={<Badge>{counts.users}</Badge>}
              />
            )}
            {canRoles && (
              <ListRow
                href="/settings/roles"
                leading={<IconTile icon={KeyRound} tone="ok" />}
                title={t.settings.roles}
                trailing={<Badge>{counts.roles}</Badge>}
              />
            )}
            {canAdmins && (
              <ListRow
                href="/settings/admins"
                leading={<IconTile icon={Crown} tone="warn" />}
                title={t.settings.admins}
                trailing={<Badge>{counts.superAdmins}</Badge>}
              />
            )}
          </List>
        </section>
      )}

      <form action="/api/auth/logout" method="post">
        <Button type="submit" variant="danger" size="lg" className="w-full">
          <LogOut />
          {t.common.signOut}
        </Button>
      </form>
    </div>
  );
}
