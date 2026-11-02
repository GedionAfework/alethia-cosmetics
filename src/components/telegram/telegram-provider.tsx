"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Script from "next/script";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        initData: string;
      };
    };
  }
}

async function waitForInitData(attempts = 20) {
  for (let i = 0; i < attempts; i++) {
    const initData = window.Telegram?.WebApp?.initData;
    if (initData) return initData;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return window.Telegram?.WebApp?.initData || "";
}

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const booted = useRef(false);

  async function authenticate() {
    if (booted.current) return;
    const initData = await waitForInitData();
    const tg = window.Telegram?.WebApp;
    if (!tg || !initData) return;

    booted.current = true;
    tg.ready();
    tg.expand();

    try {
      const res = await fetch("/api/auth/telegram", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData }),
      });
      const data = (await res.json().catch(() => ({}))) as { home?: string; error?: string };

      if (res.status === 403) {
        if (pathname !== "/login") router.replace("/login?telegram=unlinked");
        else router.replace("/login?telegram=unlinked");
        return;
      }
      if (res.status === 401 || res.status === 503) {
        router.replace(`/login?telegram=auth&error=${encodeURIComponent(data.error || "Telegram login failed")}`);
        return;
      }
      if (!res.ok) {
        router.replace(`/login?telegram=auth&error=${encodeURIComponent(data.error || "Could not sign in")}`);
        return;
      }

      router.replace(data.home || "/account");
      router.refresh();
    } catch (err) {
      booted.current = false;
      console.error("Telegram auth failed", err);
      router.replace("/login?telegram=auth&error=network");
    }
  }

  useEffect(() => {
    if (window.Telegram?.WebApp) void authenticate();
  }, [pathname]);

  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="beforeInteractive"
        onLoad={() => {
          void authenticate();
        }}
      />
      {children}
    </>
  );
}
