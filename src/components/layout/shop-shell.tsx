"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { RawRuleOf } from "@casl/ability";
import { Button } from "@/components/ui/button";
import { abilityFromRules, type AppAbility } from "@/lib/auth/ability";

const links: { href: string; label: string; show: (ability: AppAbility) => boolean }[] = [
  { href: "/admin", label: "Dashboard", show: (ability) => ability.can("read", "Dashboard") },
  { href: "/admin/inventory", label: "Inventory", show: (ability) => ability.can("read", "Inventory") },
  { href: "/admin/receive", label: "Receive", show: (ability) => ability.can("create", "StockReceipt") },
  { href: "/admin/alerts", label: "Alerts", show: (ability) => ability.can("read", "Alert") },
  { href: "/admin/sales", label: "Daily sales", show: (ability) => ability.can("read", "SalesLedger") },
  { href: "/admin/reports", label: "Monthly", show: (ability) => ability.can("read", "Report") },
  { href: "/pos", label: "Sell", show: (ability) => ability.can("create", "Sale") },
  {
    href: "/pos/sales",
    label: "My sales",
    show: (ability) => ability.can("read", "Sale") && !ability.can("read", "SalesLedger"),
  },
  { href: "/admin/roles", label: "Roles", show: (ability) => ability.can("manage", "Role") },
  { href: "/admin/users", label: "Users", show: (ability) => ability.can("manage", "User") },
  { href: "/account/settings", label: "Settings", show: (ability) => ability.can("manage", "Settings") },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin" || href === "/pos") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ShopShell({
  name,
  roleName,
  rules,
  children,
}: {
  name: string;
  roleName: string;
  rules: RawRuleOf<AppAbility>[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const ability = abilityFromRules(rules);
  const visible = links.filter((link) => link.show(ability));

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="no-print sticky top-0 z-30 border-b border-[var(--border)] bg-white/95 text-[var(--ink)] backdrop-blur lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between gap-3 px-4 py-4 lg:px-5 lg:pt-6">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-[var(--accent)] text-sm font-semibold text-white">
              A
            </span>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">Aletheia</p>
              <p className="font-display text-lg leading-tight">Cosmo & Gift</p>
            </div>
          </div>
          <form action="/api/auth/logout" method="post" className="lg:hidden">
            <Button type="submit" variant="secondary" size="sm">
              Sign out
            </Button>
          </form>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:flex-1 lg:space-y-1 lg:overflow-visible lg:px-3 lg:pb-4">
          {visible.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block shrink-0 rounded-xl px-3 py-2 text-sm font-semibold ${
                  active
                    ? "bg-[var(--accent)] text-white"
                    : "text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--ink)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden border-t border-[var(--border)] px-4 py-4 lg:block">
          <div className="rounded-2xl bg-[var(--bg)] px-3 py-3">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="truncate text-xs text-[var(--muted)]">{roleName}</p>
          </div>
          <form action="/api/auth/logout" method="post" className="mt-3">
            <Button type="submit" variant="secondary" size="sm" className="w-full">
              Sign out
            </Button>
          </form>
        </div>
      </aside>
      <p className="no-print px-4 pt-3 text-sm text-[var(--muted)] lg:hidden">
        {name} · {roleName}
      </p>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
