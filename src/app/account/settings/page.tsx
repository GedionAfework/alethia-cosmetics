import type { RawRuleOf } from "@casl/ability";
import { SuperAdminSettings } from "@/components/admin/super-admin-settings";
import { ShopShell } from "@/components/layout/shop-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { requirePage } from "@/lib/auth/access";
import type { AppAbility } from "@/lib/auth/ability";
import { listActiveStaff } from "@/services/access.service";

export const dynamic = "force-dynamic";

const notices: Record<string, string> = {
  granted: "Super Admin granted. They keep their shop role and can now manage roles and users.",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const access = await requirePage((ability) => ability.can("manage", "Settings"));
  const { notice } = await searchParams;
  const staff = await listActiveStaff();
  const superAdmins = staff.filter((person) => person.isSuperAdmin);

  return (
    <ShopShell
      name={access.user.name}
      roleName={access.user.isSuperAdmin ? `Super Admin · ${access.user.roleName}` : access.user.roleName}
      rules={JSON.parse(JSON.stringify(access.ability.rules)) as RawRuleOf<AppAbility>[]}
    >
      <PageHeader
        title="Settings"
        description="Grant Super Admin to another person, or hand off your Super Admin access entirely."
      />
      {notice && notices[notice] && (
        <div className="mt-4">
          <Notice tone="ok">{notices[notice]}</Notice>
        </div>
      )}
      <Card className="mt-6 max-w-2xl">
        <p className="text-sm font-semibold">Current Super Admins</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {superAdmins.map((person) => (
            <Badge key={person.id} tone={person.id === access.user.id ? "ok" : "muted"}>
              {person.name}
              {person.telegramUsername ? ` @${person.telegramUsername}` : ""}
            </Badge>
          ))}
        </div>
      </Card>
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
    </ShopShell>
  );
}
