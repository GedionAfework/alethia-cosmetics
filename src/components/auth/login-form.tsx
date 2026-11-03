"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/fields";
import { Notice } from "@/components/ui/notice";
import { useI18n } from "@/lib/i18n/client";

function inTelegram() {
  return Boolean(window.Telegram?.WebApp?.initData);
}

const noopSubscribe = () => () => {};

export function LoginForm({ showDevHint }: { showDevHint: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, fmt, err } = useI18n();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const telegramMode = useSyncExternalStore(noopSubscribe, inTelegram, () => false);
  const telegramFailed = searchParams.get("telegram") === "auth" || searchParams.get("telegram") === "unlinked";

  async function signIn(url: string, body: Record<string, unknown>) {
    setPending(true);
    setError("");
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string; home?: string };
      if (!res.ok) {
        setError(data.error ? err(data.error) : t.login.failed);
        setPending(false);
        return;
      }
      router.replace(data.home || "/settings");
      router.refresh();
    } catch {
      setError(t.login.failed);
      setPending(false);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await signIn("/api/auth/login", { username: form.get("username"), password: form.get("password") });
  }

  if (telegramMode && !telegramFailed) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-accent-soft px-4 py-4 text-sm font-semibold text-accent">
        <LoaderCircle className="size-5 animate-spin" />
        {t.login.telegram}
      </div>
    );
  }

  if (telegramMode && telegramFailed) {
    return <p className="text-sm text-muted">{t.login.telegramFailed}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <TextField label={t.login.username} name="username" autoComplete="username" autoCapitalize="none" required />
      <TextField label={t.login.password} name="password" type="password" autoComplete="current-password" required />
      {error && <Notice tone="danger">{error}</Notice>}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? t.login.submitting : t.login.submit}
      </Button>
      {showDevHint && (
        <div className="grid grid-cols-2 gap-2 border-t border-line pt-4">
          {["admin", "cashier"].map((username) => (
            <Button
              key={username}
              variant="secondary"
              size="sm"
              onClick={() => signIn("/api/auth/dev-login", { username })}
              disabled={pending}
            >
              {fmt(t.login.devAs, { name: username })}
            </Button>
          ))}
        </div>
      )}
    </form>
  );
}
