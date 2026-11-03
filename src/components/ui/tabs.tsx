"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type TabItem = { href: string; label: string };

/** Pill tabs that link between sibling pages of a section. */
export function Tabs({ items, className }: { items: TabItem[]; className?: string }) {
  const pathname = usePathname();
  if (items.length < 2) return null;

  return (
    <nav
      className={cn(
        "no-print scrollbar-none mb-5 -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:w-fit sm:rounded-2xl sm:bg-surface-2 sm:p-1",
        className
      )}
    >
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition",
              active
                ? "bg-surface text-ink shadow-[var(--shadow)] ring-1 ring-line sm:ring-0"
                : "text-muted hover:text-ink"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
