import { notFound } from "next/navigation";
import { UserForm } from "@/components/admin/user-form";
import { ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { requirePage } from "@/lib/auth/access";
import { getUser, listRoles } from "@/services/access.service";

export async function UserEditor({ id }: { id?: string }) {
  const access = await requirePage((ability) => ability.can("manage", "User"));
  const [roles, user] = await Promise.all([listRoles(), id ? getUser(id) : Promise.resolve(null)]);
  if (id && !user) notFound();

  return (
    <div className="mx-auto max-w-xl">
      <ButtonLink href="/admin/users" variant="ghost" size="sm">
        All users
      </ButtonLink>
      <div className="mt-3">
        <PageHeader
          title={user ? user.name : "New user"}
          description={
            roles.length === 0
              ? "Create a role and select its permissions before adding a person."
              : "Add them by Telegram username and assign a shop role."
          }
        />
      </div>
      {roles.length === 0 && (
        <div className="mt-4">
          <Notice>
            No roles exist yet.{" "}
            <a href="/admin/roles/new" className="font-semibold">
              Create a role
            </a>{" "}
            first.
          </Notice>
        </div>
      )}
      <div className="mt-6">
        <UserForm
          actorIsSuperAdmin={access.user.isSuperAdmin}
          roles={roles.map((role) => ({ id: role.id, name: role.name }))}
          user={
            user
              ? {
                  id: user.id,
                  name: user.name,
                  username: user.username,
                  roleId: user.roleId,
                  telegramUsername: user.telegramUsername || "",
                  isActive: user.isActive,
                  isSuperAdmin: user.isSuperAdmin,
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
