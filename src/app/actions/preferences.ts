"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { isLocale, isTheme, LOCALE_COOKIE, THEME_COOKIE } from "@/lib/preferences";

function cookieOptions() {
  // Match the session cookie so preferences survive inside the Telegram WebView.
  const production = process.env.NODE_ENV === "production";
  return {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: production ? ("none" as const) : ("lax" as const),
    secure: production,
  };
}

export async function setThemeAction(theme: string) {
  if (!isTheme(theme)) return;
  (await cookies()).set(THEME_COOKIE, theme, cookieOptions());
  refresh();
}

export async function setLocaleAction(locale: string) {
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, cookieOptions());
  refresh();
}
