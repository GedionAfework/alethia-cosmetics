import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { requirePage } from "@/lib/auth/access";
import { listUsers } from "@/services/access.service";

export const dynamic = "force-dynamic";

const notices: Record<string, string> = {
  created: "User created. They can open the Mini App with that Telegram account to sign in.",
  updated: "User updated.",
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  await requirePage((ability) => ability.can("manage", "User"));
  const { notice } = await searchParams;
  const users = await listUsers();

  return (
    <div>
      <PageHeader
        title="Users"
        description="Add staff by Telegram username after their role exists. Shop access follows that role; Super Admin is separate."
        actions={<ButtonLink href="/admin/users/new">New user</ButtonLink>}
      />
      {notice && notices[notice] && (
        <div className="mt-4">
          <Notice tone="ok">{notices[notice]}</Notice>
        </div>
      )}
      <div className="mt-6 grid gap-3">
        {users.length === 0 && <Empty>No users yet.</Empty>}
        {users.map((user) => (
          <Card key={user.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{user.name}</h2>
                <p className="text-sm text-[var(--muted)]">
                  {user.telegramUsername ? `@${user.telegramUsername}` : user.username}
                  {" · "}
                  {user._count.sales} sales
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {user.isSuperAdmin && <Badge>Super Admin</Badge>}
                <Badge tone="muted">{user.role.name}</Badge>
                <Badge tone={user.isActive ? "ok" : "out"}>{user.isActive ? "Active" : "Inactive"}</Badge>
                <ButtonLink href={`/admin/users/${user.id}`} variant="secondary" size="sm">
                  Edit
                </ButtonLink>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
