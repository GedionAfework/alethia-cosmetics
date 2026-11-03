import Link from "next/link";
import { notFound } from "next/navigation";
import { UserForm } from "@/components/admin/user-form";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { requirePage } from "@/lib/auth/access";
import { getI18n } from "@/lib/i18n/server";
import { getUser, listRoles } from "@/services/access.service";

export async function UserEditor({ id }: { id?: string }) {
  const access = await requirePage((ability) => ability.can("manage", "User"));
  const [{ t }, roles, user] = await Promise.all([getI18n(), listRoles(), id ? getUser(id) : Promise.resolve(null)]);
  if (id && !user) notFound();

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title={user ? user.name : t.users.new} back={{ href: "/settings/users", label: t.users.title }} />
      {roles.length === 0 && (
        <Notice className="mb-4">
          <Link href="/settings/roles/new" className="font-bold underline underline-offset-2">
            {t.users.needRole}
          </Link>
        </Notice>
      )}
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
  );
}
