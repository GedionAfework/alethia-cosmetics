"use client";

import { useRef } from "react";
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

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const booted = useRef(false);

  async function authenticate() {
    if (booted.current) return;
    const tg = window.Telegram?.WebApp;
    if (!tg?.initData) return;
    booted.current = true;
    tg.ready();
    tg.expand();
    try {
      const res = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: tg.initData }),
      });
      if (res.status === 403) {
        if (pathname !== "/login") router.replace("/login?telegram=unlinked");
        return;
      }
      if (!res.ok) return;
      const data = (await res.json()) as { home?: string };
      router.refresh();
      if (pathname === "/" || pathname === "/login") {
        router.replace(data.home || "/account");
      }
    } catch (err) {
      booted.current = false;
      console.error("Telegram auth failed", err);
    }
  }

  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="afterInteractive"
        onLoad={() => {
          void authenticate();
        }}
      />
      {children}
    </>
  );
}
