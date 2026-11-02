import { notFound } from "next/navigation";
import { deleteRoleAction } from "@/app/actions/access";
import { RoleForm } from "@/components/admin/role-form";
import { Button, ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { requirePage } from "@/lib/auth/access";
import { getRole } from "@/services/access.service";

export async function RoleEditor({ id, error }: { id?: string; error?: string }) {
  await requirePage((ability) => ability.can("manage", "Role"));
  const role = id ? await getRole(id) : null;
  if (id && !role) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <ButtonLink href="/admin/roles" variant="ghost" size="sm">
        All roles
      </ButtonLink>
      <div className="mt-3">
        <PageHeader
          title={role ? role.name : "New role"}
          description={
            role
              ? "Changes apply the next time someone with this role opens a page."
              : "Name the role, then select what it can do."
          }
        />
      </div>
      {error && (
        <div className="mt-4">
          <Notice tone="danger">{error}</Notice>
        </div>
      )}
      <div className="mt-6">
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
      </div>
      {role && (
        <form action={deleteRoleAction} className="mt-4">
          <input type="hidden" name="id" value={role.id} />
          <Button type="submit" variant="danger" disabled={role._count.users > 0}>
            Delete role
          </Button>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {role._count.users > 0
              ? "Move everyone off this role before deleting it."
              : "This removes the role. It does not remove permissions from other roles."}
          </p>
        </form>
      )}
    </div>
  );
}
