import { Crown } from "lucide-react";
import { SuperAdminSettings } from "@/components/admin/super-admin-settings";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SectionTitle } from "@/components/ui/card";
import { List, ListRow } from "@/components/ui/list";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { requirePage } from "@/lib/auth/access";
import { getI18n } from "@/lib/i18n/server";
import { listActiveStaff } from "@/services/access.service";

export const dynamic = "force-dynamic";

export default async function AdminsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const access = await requirePage((ability) => ability.can("manage", "Settings"));
  const { notice } = await searchParams;
  const [{ t }, staff] = await Promise.all([getI18n(), listActiveStaff()]);
  const superAdmins = staff.filter((person) => person.isSuperAdmin);

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title={t.admins.title} back={{ href: "/settings", label: t.settings.title }} />
      {notice === "granted" && <Notice tone="ok" className="mb-4">{t.admins.granted}</Notice>}

      <section className="mb-8">
        <SectionTitle>{t.admins.current}</SectionTitle>
        <List>
          {superAdmins.map((person) => (
            <ListRow
              key={person.id}
              leading={<Avatar name={person.name} />}
              title={
                <span className="flex items-center gap-1.5">
                  <span className="truncate">{person.name}</span>
                  <Crown className="size-3.5 shrink-0 text-warn" />
                </span>
              }
              subtitle={person.telegramUsername ? `@${person.telegramUsername}` : person.username}
              trailing={person.id === access.user.id ? <Badge tone="accent">{t.common.you}</Badge> : undefined}
            />
          ))}
        </List>
      </section>

      {access.user.isSuperAdmin && (
        <SuperAdminSettings
          currentUserId={access.user.id}
          staff={staff.map((person) => ({
            id: person.id,
            name: person.name,
            telegramUsername: person.telegramUsername,
            isSuperAdmin: person.isSuperAdmin,
            roleName: person.role.name,
          }))}
        />
      )}
    </div>
  );
}
