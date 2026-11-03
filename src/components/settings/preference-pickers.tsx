"use client";

import { useTransition } from "react";
import { Check } from "lucide-react";
import { setLocaleAction, setThemeAction } from "@/app/actions/preferences";
import { useI18n } from "@/lib/i18n/client";
import { LOCALES, THEME_SWATCHES, THEMES, type Theme } from "@/lib/preferences";
import { haptic, syncTelegramChrome } from "@/lib/telegram/client";
import { cn } from "@/lib/utils";

/** Paint the theme immediately; the server action makes it stick. */
function paintTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  syncTelegramChrome();
}

export function ThemePicker() {
  const { t, theme } = useI18n();
  const [pending, startTransition] = useTransition();

  function choose(next: Theme) {
    if (next === theme) return;
    haptic.select();
    paintTheme(next);
    startTransition(() => setThemeAction(next));
  }

  return (
    <div className={cn("grid grid-cols-3 gap-2.5 sm:grid-cols-5", pending && "opacity-80")}>
      {THEMES.map((name) => {
        const [canvas, surface, accent] = THEME_SWATCHES[name];
        const active = name === theme;
        return (
          <button
            key={name}
            type="button"
            onClick={() => choose(name)}
            aria-pressed={active}
            className={cn(
              "group rounded-2xl p-1.5 text-left ring-1 transition active:scale-95",
              active ? "ring-2 ring-accent" : "ring-line hover:ring-muted/40"
            )}
          >
            <div className="relative h-20 overflow-hidden rounded-xl p-2" style={{ background: canvas }}>
              <div className="h-full rounded-lg p-2 shadow-sm" style={{ background: surface }}>
                <div className="h-2 w-2/3 rounded-full opacity-20" style={{ background: accent }} />
                <div className="mt-1.5 h-2 w-1/2 rounded-full opacity-20" style={{ background: accent }} />
                <div className="mt-2.5 h-4 w-10 rounded-md" style={{ background: accent }} />
              </div>
              {active && (
                <span
                  className="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full text-white"
                  style={{ background: accent }}
                >
                  <Check className="size-3" strokeWidth={3} />
                </span>
              )}
            </div>
            <p className={cn("mt-1.5 px-1 text-xs font-semibold", active ? "text-ink" : "text-muted")}>
              {t.settings.themes[name]}
            </p>
          </button>
        );
      })}
    </div>
  );
}

export function LanguagePicker() {
  const { t, locale } = useI18n();
  const [pending, startTransition] = useTransition();

  return (
    <div className={cn("grid grid-cols-2 gap-1 rounded-2xl bg-surface-2 p-1", pending && "opacity-70")}>
      {LOCALES.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            aria-pressed={active}
            disabled={pending}
            onClick={() => {
              if (active) return;
              haptic.select();
              startTransition(() => setLocaleAction(code));
            }}
            className={cn(
              "flex h-11 items-center justify-center gap-2 rounded-xl text-[15px] font-semibold transition",
              active ? "bg-surface text-ink shadow-[var(--shadow)]" : "text-muted hover:text-ink"
            )}
          >
            <span className="text-xs font-bold tracking-wider text-accent uppercase">{code}</span>
            {t.settings.languages[code]}
          </button>
        );
      })}
    </div>
  );
}
