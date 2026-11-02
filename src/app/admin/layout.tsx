import type { RawRuleOf } from "@casl/ability";
import { ShopShell } from "@/components/layout/shop-shell";
import { requireOffice } from "@/lib/auth/access";
import type { AppAbility } from "@/lib/auth/ability";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const access = await requireOffice();
  const roleName = access.user.isSuperAdmin
    ? `Super Admin · ${access.user.roleName}`
    : access.user.roleName;
  return (
    <ShopShell
      name={access.user.name}
      roleName={roleName}
      rules={JSON.parse(JSON.stringify(access.ability.rules)) as RawRuleOf<AppAbility>[]}
    >
      {children}
    </ShopShell>
  );
}
