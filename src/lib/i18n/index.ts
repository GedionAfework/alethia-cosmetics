import { am } from "@/lib/i18n/am";
import { en, type Messages } from "@/lib/i18n/en";
import type { Locale } from "@/lib/preferences";
import { SHOP_TZ } from "@/lib/time";

export type { Messages };

const dictionaries: Record<Locale, Messages> = { en, am };

export function getMessages(locale: Locale): Messages {
  return dictionaries[locale] ?? en;
}

/** Replace `{key}` placeholders. */
export function fmt(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match
  );
}

const errorPatterns: { re: RegExp; am: (m: RegExpMatchArray) => string }[] = [
  { re: /^(.+) only has (\d+) in stock\.$/, am: (m) => `${m[1]} በክምችት ያለው ${m[2]} ብቻ ነው።` },
  { re: /^(.+) does not have enough stock\.$/, am: (m) => `${m[1]} በቂ ክምችት የለውም።` },
  { re: /^You don't have permission/, am: () => "ለዚህ ፈቃድ የለዎትም።" },
  { re: /^Only (an active )?a? ?Super Admin/, am: () => "ይህንን ማድረግ የሚችለው ዋና አስተዳዳሪ ብቻ ነው።" },
];

/** Translate a server error message. Unknown messages pass through unchanged. */
export function translateError(messages: Messages, locale: Locale, message: string) {
  if (locale === "en") return message;
  const direct = messages.errors[message];
  if (direct) return direct;
  for (const pattern of errorPatterns) {
    const match = message.match(pattern.re);
    if (match) return pattern.am(match);
  }
  return message;
}

function intlLocale(locale: Locale) {
  return locale === "am" ? "am-ET" : "en-GB";
}

export function formatMoney(value: number, locale: Locale = "en") {
  const amount = value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return locale === "am" ? `${amount} ብር` : `ETB ${amount}`;
}

/** Compact amount for tight spaces (e.g. chart labels). */
export function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function formatDateTime(date: Date, locale: Locale = "en") {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: SHOP_TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatTime(date: Date, locale: Locale = "en") {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: SHOP_TZ,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatLongDate(dateLabel: string, locale: Locale = "en") {
  const date = new Date(`${dateLabel}T12:00:00+03:00`);
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: SHOP_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

export function monthName(index: number, locale: Locale = "en", style: "long" | "short" = "long") {
  return new Intl.DateTimeFormat(intlLocale(locale), { month: style, timeZone: "UTC" }).format(
    new Date(Date.UTC(2026, index, 15))
  );
}
