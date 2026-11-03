import type { RawRuleOf } from "@casl/ability";
import { ShopShell } from "@/components/layout/shop-shell";
import type { AppAbility } from "@/lib/auth/ability";
import type { AppUser } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";

/** Server wrapper that hands the signed-in user's rules to the client shell. */
export async function AppFrame({
  access,
  children,
}: {
  access: { user: AppUser; ability: AppAbility };
  children: React.ReactNode;
}) {
  const { t } = await getI18n();
  const roleName = access.user.isSuperAdmin
    ? `${t.common.superAdmin} · ${access.user.roleName}`
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
