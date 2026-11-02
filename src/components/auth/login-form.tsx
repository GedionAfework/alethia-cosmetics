"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/fields";
import { Notice } from "@/components/ui/notice";

function inTelegram() {
  return Boolean(typeof window !== "undefined" && window.Telegram?.WebApp?.initData);
}

export function LoginForm({ showDevHint }: { showDevHint: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [telegramMode, setTelegramMode] = useState(false);
  const telegramFailed = searchParams.get("telegram") === "auth" || searchParams.get("telegram") === "unlinked";

  useEffect(() => {
    setTelegramMode(inTelegram());
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.get("username"),
          password: form.get("password"),
        }),
      });
      const data = (await res.json()) as { error?: string; home?: string };
      if (!res.ok) {
        setError(data.error || "Could not sign in.");
        setPending(false);
        return;
      }
      router.replace(data.home || "/account");
      router.refresh();
    } catch {
      setError("Could not sign in.");
      setPending(false);
    }
  }

  async function devLogin(username: string) {
    setPending(true);
    setError("");
    const res = await fetch("/api/auth/dev-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const data = (await res.json()) as { error?: string; home?: string };
    if (!res.ok) {
      setError(data.error || "Could not sign in.");
      setPending(false);
      return;
    }
    router.replace(data.home || "/account");
    router.refresh();
  }

  if (telegramMode && !telegramFailed) {
    return (
      <div className="space-y-3">
        <Notice>Signing you in with Telegram…</Notice>
        <p className="text-sm text-[var(--muted)]">No username or password is needed inside the Mini App.</p>
      </div>
    );
  }

  if (telegramMode && telegramFailed) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-[var(--muted)]">
          Fix the issue above, then fully close this Mini App and open it again from the bot menu.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <TextField label="Username" name="username" autoComplete="username" required />
      <TextField label="Password" name="password" type="password" autoComplete="current-password" required />
      {error && <Notice tone="danger">{error}</Notice>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      {showDevHint && (
        <div className="space-y-3 border-t border-[var(--border)] pt-4">
          <p className="text-sm text-[var(--muted)]">
            Local seed accounts are <span className="font-semibold text-[var(--ink)]">admin</span> and{" "}
            <span className="font-semibold text-[var(--ink)]">cashier</span>. Passwords are in <code>.env</code>.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => devLogin("admin")} disabled={pending}>
              Continue as admin
            </Button>
            <Button type="button" variant="secondary" onClick={() => devLogin("cashier")} disabled={pending}>
              Continue as cashier
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
