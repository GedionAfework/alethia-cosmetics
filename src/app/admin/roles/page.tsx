import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { requirePage } from "@/lib/auth/access";
import { permissionLabel } from "@/lib/auth/permissions";
import { listRoles } from "@/services/access.service";

export const dynamic = "force-dynamic";

const notices: Record<string, string> = {
  created: "Role created. You can now assign it to a user.",
  updated: "Role updated. People with this role pick up the new permissions on their next request.",
  deleted: "Role deleted.",
};

export default async function RolesPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  await requirePage((ability) => ability.can("manage", "Role"));
  const { notice } = await searchParams;
  const roles = await listRoles();

  return (
    <div>
      <PageHeader
        title="Roles"
        description="Create shop roles and choose their permissions. Super Admin access is managed separately in Settings."
        actions={<ButtonLink href="/admin/roles/new">New role</ButtonLink>}
      />
      {notice && notices[notice] && (
        <div className="mt-4">
          <Notice tone="ok">{notices[notice]}</Notice>
        </div>
      )}
      <div className="mt-6 grid gap-3">
        {roles.length === 0 && <Empty>No roles yet. Create one before adding users.</Empty>}
        {roles.map((role) => (
          <Card key={role.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl">{role.name}</h2>
                {role.description && <p className="mt-1 text-sm text-[var(--muted)]">{role.description}</p>}
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {role._count.users} {role._count.users === 1 ? "person" : "people"}
                </p>
              </div>
              <ButtonLink href={`/admin/roles/${role.id}`} variant="secondary" size="sm">
                Edit
              </ButtonLink>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {role.permissions.map((row) => (
                <Badge key={row.permission} tone="muted">
                  {permissionLabel(row.permission)}
                </Badge>
              ))}
            </div>
          </Card>
        ))}
      </div>
      <p className="mt-6 text-sm text-[var(--muted)]">
        Next, open{" "}
        <Link href="/admin/users" className="font-semibold text-[var(--accent-dark)]">
          Users
        </Link>{" "}
        and assign a role.
      </p>
    </div>
  );
}
