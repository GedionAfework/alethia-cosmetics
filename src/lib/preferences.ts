export const THEMES = ["blush", "midnight", "ocean", "noir", "sage"] as const;
export type Theme = (typeof THEMES)[number];
export const DEFAULT_THEME: Theme = "blush";

export const LOCALES = ["en", "am"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const THEME_COOKIE = "alethia_theme";
export const LOCALE_COOKIE = "alethia_lang";

/** Swatch colors for the theme picker: canvas, surface, accent. */
export const THEME_SWATCHES: Record<Theme, [string, string, string]> = {
  blush: ["#fbf7f6", "#ffffff", "#b83262"],
  midnight: ["#0b0b12", "#15151f", "#a78bfa"],
  ocean: ["#f3f7fc", "#ffffff", "#2563eb"],
  noir: ["#0e0d0b", "#181613", "#d8a95c"],
  sage: ["#f4f6f1", "#ffffff", "#3d7a57"],
};

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
