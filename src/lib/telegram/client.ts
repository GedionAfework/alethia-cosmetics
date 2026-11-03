"use client";

type HapticStyle = "light" | "medium" | "heavy" | "rigid" | "soft";
type HapticNotice = "error" | "success" | "warning";

export type TelegramWebApp = {
  initData: string;
  version?: string;
  ready: () => void;
  expand: () => void;
  isVersionAtLeast?: (version: string) => boolean;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  setBottomBarColor?: (color: string) => void;
  disableVerticalSwipes?: () => void;
  HapticFeedback?: {
    impactOccurred: (style: HapticStyle) => void;
    notificationOccurred: (type: HapticNotice) => void;
    selectionChanged: () => void;
  };
};

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export function telegramApp(): TelegramWebApp | undefined {
  if (typeof window === "undefined") return undefined;
  const app = window.Telegram?.WebApp;
  return app?.initData ? app : undefined;
}

function supports(app: TelegramWebApp, version: string) {
  return app.isVersionAtLeast ? app.isVersionAtLeast(version) : false;
}

export const haptic = {
  tap(style: HapticStyle = "light") {
    const app = telegramApp();
    if (app && supports(app, "6.1")) app.HapticFeedback?.impactOccurred(style);
  },
  notify(type: HapticNotice) {
    const app = telegramApp();
    if (app && supports(app, "6.1")) app.HapticFeedback?.notificationOccurred(type);
  },
  select() {
    const app = telegramApp();
    if (app && supports(app, "6.1")) app.HapticFeedback?.selectionChanged();
  },
};

/** Paint Telegram's header and background with the active theme's canvas color. */
export function syncTelegramChrome() {
  const app = telegramApp();
  if (!app) return;
  const canvas = getComputedStyle(document.documentElement).getPropertyValue("--canvas").trim();
  if (!/^#[0-9a-f]{6}$/i.test(canvas)) return;
  try {
    if (supports(app, "6.1")) {
      app.setHeaderColor?.(canvas);
      app.setBackgroundColor?.(canvas);
    }
    if (supports(app, "7.10")) app.setBottomBarColor?.(canvas);
  } catch {
    // Older clients reject custom colors; the default chrome is fine.
  }
}
