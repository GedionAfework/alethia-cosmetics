"use client";

import { createContext, useContext, useMemo } from "react";
import { fmt, formatMoney, translateError, type Messages } from "@/lib/i18n";
import type { Locale, Theme } from "@/lib/preferences";

type I18nValue = {
  t: Messages;
  locale: Locale;
  theme: Theme;
  /** Shop logo URL, or null to show the letter mark. */
  logoUrl: string | null;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  messages,
  locale,
  theme,
  logoUrl,
  children,
}: {
  messages: Messages;
  locale: Locale;
  theme: Theme;
  logoUrl: string | null;
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ t: messages, locale, theme, logoUrl }), [messages, locale, theme, logoUrl]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return {
    ...ctx,
    fmt,
    money: (value: number) => formatMoney(value, ctx.locale),
    err: (message: string) => translateError(ctx.t, ctx.locale, message),
  };
}
