import type { RawRuleOf } from "@casl/ability";
import Link from "next/link";
import { ShopShell } from "@/components/layout/shop-shell";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { requirePage } from "@/lib/auth/access";
import type { AppAbility } from "@/lib/auth/ability";

export const dynamic = "force-dynamic";

const notices: Record<string, string> = {
  "handed-off": "Super Admin handed off. Your shop access now follows your role only.",
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const access = await requirePage(() => true);
  const { notice } = await searchParams;
  const roleLabel = access.user.isSuperAdmin
    ? `Super Admin · ${access.user.roleName}`
    : access.user.roleName;

  return (
    <ShopShell
      name={access.user.name}
      roleName={roleLabel}
      rules={JSON.parse(JSON.stringify(access.ability.rules)) as RawRuleOf<AppAbility>[]}
    >
      <PageHeader title="Your account" description={`${access.user.name} · ${roleLabel}`} />
      {notice && notices[notice] && (
        <div className="mt-4 max-w-lg">
          <Notice tone="ok">{notices[notice]}</Notice>
        </div>
      )}
      <Card className="mt-6 max-w-lg space-y-3">
        <p>
          Signed in as{" "}
          <span className="font-semibold">
            {access.user.telegramUsername ? `@${access.user.telegramUsername}` : access.user.username}
          </span>
          .
        </p>
        <p className="text-sm text-[var(--muted)]">
          Shop permissions come from your role
          {access.user.isSuperAdmin
            ? ". As Super Admin you can also create roles and users."
            : ". Ask a Super Admin if you need more access."}
        </p>
        {access.user.isSuperAdmin && (
          <ButtonLink href="/account/settings" variant="secondary" size="sm">
            Open settings
          </ButtonLink>
        )}
        {!access.user.isSuperAdmin && (
          <p className="text-sm text-[var(--muted)]">
            Need a link back to work? Start from the{" "}
            <Link href="/" className="font-semibold text-[var(--ink)]">
              home page
            </Link>
            .
          </p>
        )}
      </Card>
    </ShopShell>
  );
}
