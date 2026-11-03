import { KeyRound, Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { IconTile, List, ListRow } from "@/components/ui/list";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { requirePage } from "@/lib/auth/access";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getI18n } from "@/lib/i18n/server";
import { listRoles } from "@/services/access.service";

export const dynamic = "force-dynamic";

export default async function RolesPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  await requirePage((ability) => ability.can("manage", "Role"));
  const { notice } = await searchParams;
  const [{ t, fmt }, roles] = await Promise.all([getI18n(), listRoles()]);
  const notices: Record<string, string> = {
    created: t.roles.created,
    updated: t.roles.updated,
    deleted: t.roles.deleted,
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={t.settings.roles}
        back={{ href: "/settings", label: t.settings.title }}
        actions={
          <ButtonLink href="/settings/roles/new">
            <Plus />
            {t.roles.new}
          </ButtonLink>
        }
      />
      {notice && notices[notice] && <Notice tone="ok" className="mb-4">{notices[notice]}</Notice>}
      {roles.length === 0 ? (
        <Empty icon={KeyRound}>{t.roles.empty}</Empty>
      ) : (
        <List>
          {roles.map((role) => (
            <ListRow
              key={role.id}
              href={`/settings/roles/${role.id}`}
              leading={<IconTile icon={KeyRound} tone="ok" />}
              title={role.name}
              subtitle={fmt(t.roles.members, { n: role._count.users })}
              trailing={
                <span className="tabular text-sm font-semibold text-muted">
                  {role.permissions.length}/{PERMISSIONS.length}
                </span>
              }
            />
          ))}
        </List>
      )}
    </div>
  );
}
