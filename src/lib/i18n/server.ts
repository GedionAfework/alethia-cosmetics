import { cookies } from "next/headers";
import { fmt, getMessages, translateError } from "@/lib/i18n";
import {
  DEFAULT_LOCALE,
  DEFAULT_THEME,
  isLocale,
  isTheme,
  LOCALE_COOKIE,
  THEME_COOKIE,
} from "@/lib/preferences";

export async function getPreferences() {
  const jar = await cookies();
  const theme = jar.get(THEME_COOKIE)?.value;
  const locale = jar.get(LOCALE_COOKIE)?.value;
  return {
    theme: isTheme(theme) ? theme : DEFAULT_THEME,
    locale: isLocale(locale) ? locale : DEFAULT_LOCALE,
  };
}

export async function getI18n() {
  const { theme, locale } = await getPreferences();
  const t = getMessages(locale);
  return {
    t,
    locale,
    theme,
    fmt,
    err: (message: string) => translateError(t, locale, message),
  };
}
