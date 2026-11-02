"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/fields";
import { Notice } from "@/components/ui/notice";

export function LoginForm({ showDevHint }: { showDevHint: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

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
