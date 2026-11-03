import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteRoleAction } from "@/app/actions/access";
import { RoleForm } from "@/components/admin/role-form";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { requirePage } from "@/lib/auth/access";
import { getI18n } from "@/lib/i18n/server";
import { getRole } from "@/services/access.service";

export async function RoleEditor({ id, error }: { id?: string; error?: string }) {
  await requirePage((ability) => ability.can("manage", "Role"));
  const [{ t, err, fmt }, role] = await Promise.all([getI18n(), id ? getRole(id) : Promise.resolve(null)]);
  if (id && !role) notFound();

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title={role ? role.name : t.roles.new}
        eyebrow={role ? fmt(t.roles.members, { n: role._count.users }) : undefined}
        back={{ href: "/settings/roles", label: t.settings.roles }}
      />
      {error && <Notice tone="danger" className="mb-4">{err(error)}</Notice>}
      <RoleForm
        role={
          role
            ? {
                id: role.id,
                name: role.name,
                description: role.description || "",
                permissions: role.permissions.map((row) => row.permission),
              }
            : undefined
        }
      />
      {role && (
        <form action={deleteRoleAction} className="mt-8 flex flex-wrap items-center gap-3">
          <input type="hidden" name="id" value={role.id} />
          <Button type="submit" variant="danger" disabled={role._count.users > 0}>
            <Trash2 />
            {t.roles.delete}
          </Button>
          {role._count.users > 0 && <span className="text-sm text-muted">{t.roles.inUse}</span>}
        </form>
      )}
    </div>
  );
}
