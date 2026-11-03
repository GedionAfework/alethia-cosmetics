import { Crown, UserPlus, Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { List, ListRow } from "@/components/ui/list";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { requirePage } from "@/lib/auth/access";
import { getI18n } from "@/lib/i18n/server";
import { listUsers } from "@/services/access.service";

export const dynamic = "force-dynamic";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  await requirePage((ability) => ability.can("manage", "User"));
  const { notice } = await searchParams;
  const [{ t }, users] = await Promise.all([getI18n(), listUsers()]);
  const notices: Record<string, string> = { created: t.users.created, updated: t.users.updated };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={t.users.title}
        back={{ href: "/settings", label: t.settings.title }}
        actions={
          <ButtonLink href="/settings/users/new">
            <UserPlus />
            {t.users.new}
          </ButtonLink>
        }
      />
      {notice && notices[notice] && <Notice tone="ok" className="mb-4">{notices[notice]}</Notice>}
      {users.length === 0 ? (
        <Empty icon={Users}>{t.users.empty}</Empty>
      ) : (
        <List>
          {users.map((user) => (
            <ListRow
              key={user.id}
              href={`/settings/users/${user.id}`}
              leading={<Avatar name={user.name} className={user.isActive ? undefined : "opacity-40 grayscale"} />}
              title={
                <span className="flex items-center gap-1.5">
                  <span className="truncate">{user.name}</span>
                  {user.isSuperAdmin && <Crown className="size-3.5 shrink-0 text-warn" aria-label={t.common.superAdmin} />}
                </span>
              }
              subtitle={`@${user.telegramUsername || user.username} · ${user.role.name}`}
              trailing={!user.isActive ? <Badge tone="out">{t.common.inactive}</Badge> : undefined}
            />
          ))}
        </List>
      )}
    </div>
  );
}
