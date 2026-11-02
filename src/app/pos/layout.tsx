import type { RawRuleOf } from "@casl/ability";
import { ShopShell } from "@/components/layout/shop-shell";
import { requirePage } from "@/lib/auth/access";
import type { AppAbility } from "@/lib/auth/ability";

export const dynamic = "force-dynamic";

export default async function PosLayout({ children }: { children: React.ReactNode }) {
  const access = await requirePage(
    (ability) => ability.can("create", "Sale") || ability.can("read", "Sale") || ability.can("read", "SalesLedger")
  );
  return (
    <ShopShell
      name={access.user.name}
      roleName={
        access.user.isSuperAdmin ? `Super Admin · ${access.user.roleName}` : access.user.roleName
      }
      rules={JSON.parse(JSON.stringify(access.ability.rules)) as RawRuleOf<AppAbility>[]}
    >
      {children}
    </ShopShell>
  );
}
