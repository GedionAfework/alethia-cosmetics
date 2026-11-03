import type { AppAbility } from "@/lib/auth/ability";
import type { Messages } from "@/lib/i18n";

export type NavKey = "home" | "sell" | "stock" | "sales" | "settings";

export type NavItem = {
  key: NavKey;
  href: string;
  /** Path prefixes that mark this tab active. */
  match: string[];
};

function firstAllowed(options: [boolean, string][]) {
  return options.find(([allowed]) => allowed)?.[1];
}

export function stockHref(ability: AppAbility) {
  return firstAllowed([
    [ability.can("read", "Inventory"), "/admin/inventory"],
    [ability.can("create", "StockReceipt"), "/admin/receive"],
    [ability.can("read", "Alert"), "/admin/alerts"],
  ]);
}

export function salesHref(ability: AppAbility) {
  return firstAllowed([
    [ability.can("read", "SalesLedger"), "/admin/sales"],
    [ability.can("read", "Report"), "/admin/reports"],
    [ability.can("read", "Sale"), "/pos/sales"],
  ]);
}

export function primaryNav(ability: AppAbility): NavItem[] {
  const items: NavItem[] = [];
  if (ability.can("read", "Dashboard")) items.push({ key: "home", href: "/admin", match: ["/admin"] });
  if (ability.can("create", "Sale")) items.push({ key: "sell", href: "/pos", match: ["/pos"] });
  const stock = stockHref(ability);
  if (stock) {
    items.push({
      key: "stock",
      href: stock,
      match: ["/admin/inventory", "/admin/receive", "/admin/alerts"],
    });
  }
  const sales = salesHref(ability);
  if (sales) {
    items.push({
      key: "sales",
      href: sales,
      match: ["/admin/sales", "/admin/reports", "/pos/sales", "/pos/receipt"],
    });
  }
  items.push({ key: "settings", href: "/settings", match: ["/settings"] });
  return items;
}

export function isNavActive(pathname: string, item: NavItem) {
  if (item.key === "home") return pathname === "/admin";
  if (item.key === "sell") return pathname === "/pos";
  return item.match.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function stockTabs(ability: AppAbility, t: Messages) {
  const tabs: { href: string; label: string }[] = [];
  if (ability.can("read", "Inventory")) tabs.push({ href: "/admin/inventory", label: t.nav.items });
  if (ability.can("create", "StockReceipt")) tabs.push({ href: "/admin/receive", label: t.nav.receive });
  if (ability.can("read", "Alert")) tabs.push({ href: "/admin/alerts", label: t.nav.alerts });
  return tabs;
}

export function salesTabs(ability: AppAbility, t: Messages) {
  const tabs: { href: string; label: string }[] = [];
  if (ability.can("read", "SalesLedger")) tabs.push({ href: "/admin/sales", label: t.nav.daily });
  if (ability.can("read", "Report")) tabs.push({ href: "/admin/reports", label: t.nav.monthly });
  if (ability.can("read", "Sale") || ability.can("read", "SalesLedger")) {
    tabs.push({ href: "/pos/sales", label: t.nav.receipts });
  }
  return tabs;
}
