"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { RawRuleOf } from "@casl/ability";
import { House, LogOut, Package, Receipt, ScanBarcode, Settings, type LucideIcon } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { abilityFromRules, type AppAbility } from "@/lib/auth/ability";
import { useI18n } from "@/lib/i18n/client";
import { isNavActive, primaryNav, type NavKey } from "@/lib/nav";
import { haptic } from "@/lib/telegram/client";
import { cn } from "@/lib/utils";

const icons: Record<NavKey, LucideIcon> = {
  home: House,
  sell: ScanBarcode,
  stock: Package,
  sales: Receipt,
  settings: Settings,
};

function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-accent to-accent-strong text-lg font-extrabold text-on-accent shadow-[0_8px_20px_-10px_var(--accent)]",
        className
      )}
    >
      A
    </span>
  );
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
  const { t } = useI18n();
  const ability = abilityFromRules(rules);
  const nav = primaryNav(ability);

  return (
    <div className="min-h-dvh lg:pl-72">
      {/* Desktop sidebar */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-line bg-surface/70 px-4 py-6 backdrop-blur-xl lg:flex">
        <Link href="/" className="mb-8 flex items-center gap-3 px-2">
          <BrandMark />
          <div className="leading-tight">
            <p className="text-lg font-extrabold tracking-tight">{t.brand.name}</p>
            <p className="text-xs font-semibold text-muted">{t.brand.tagline}</p>
          </div>
        </Link>
        <nav className="flex-1 space-y-1">
          {nav.map((item) => {
            const Icon = icons[item.key];
            const active = isNavActive(pathname, item);
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[15px] font-semibold transition",
                  active ? "bg-accent text-on-accent shadow-[0_8px_20px_-12px_var(--accent)]" : "text-muted hover:bg-surface-2 hover:text-ink"
                )}
              >
                <Icon className="size-5" />
                {t.nav[item.key]}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
          <Avatar name={name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="truncate text-xs text-muted">{roleName}</p>
          </div>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              aria-label={t.common.signOut}
              title={t.common.signOut}
              className="grid size-9 place-items-center rounded-xl text-muted transition hover:bg-surface hover:text-danger"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line/60 bg-canvas/80 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark className="size-9 rounded-xl text-base" />
          <span className="leading-tight">
            <span className="block text-[15px] font-extrabold tracking-tight">{t.brand.name}</span>
            <span className="block text-[11px] font-semibold text-muted">{t.brand.tagline}</span>
          </span>
        </Link>
        <Link href="/settings" aria-label={t.nav.settings} className="rounded-full">
          <Avatar name={name} size="sm" />
        </Link>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pt-5 pb-32 sm:px-6 lg:px-10 lg:pt-10 lg:pb-12">{children}</main>

      {/* Mobile bottom tab bar */}
      <nav className="no-print pb-safe fixed inset-x-0 bottom-0 z-40 px-3 lg:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-around gap-1 rounded-[1.75rem] bg-surface/85 p-1.5 ring-1 ring-line shadow-[0_18px_40px_-18px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          {nav.map((item) => {
            const Icon = icons[item.key];
            const active = isNavActive(pathname, item);
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => haptic.select()}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-[1.35rem] px-1 py-2 text-[11px] font-semibold transition",
                  active ? "bg-accent-soft text-accent" : "text-muted active:scale-95"
                )}
              >
                <Icon className={cn("size-[22px] transition", active && "scale-110")} strokeWidth={active ? 2.4 : 2} />
                <span className="max-w-full truncate">{t.nav[item.key]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
