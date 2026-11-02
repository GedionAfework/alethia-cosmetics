import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { Notice } from "@/components/ui/notice";
import { defineAbilityFor, homePath } from "@/lib/auth/ability";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ telegram?: string; error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect(homePath(defineAbilityFor(user)));
  const params = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-[var(--accent)] font-display text-xl text-white">
            A
          </span>
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">Aletheia</p>
            <p className="font-display text-2xl leading-none">Cosmo & Gift</p>
          </div>
        </div>
        <div className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-[0_20px_50px_-32px_rgba(36,24,28,0.45)] sm:p-8">
          <h1 className="font-display text-4xl">Sign in</h1>
          <p className="mt-2 text-[var(--muted)]">
            In Telegram, you are signed in automatically. Browser login is only a backup for local or seeded accounts.
          </p>
          {params.telegram === "unlinked" && (
            <div className="mt-4">
              <Notice tone="danger">
                This Telegram account is not on the staff list. The first Super Admin must be listed in{" "}
                <code>ADMIN_TELEGRAM_USERNAMES</code>, or a Super Admin must add your username, then reopen the bot.
              </Notice>
            </div>
          )}
          {params.telegram === "auth" && (
            <div className="mt-4">
              <Notice tone="danger">
                {params.error === "network"
                  ? "Could not reach the server to sign in with Telegram."
                  : decodeURIComponent(params.error || "Telegram login failed.")}
              </Notice>
            </div>
          )}
          <div className="mt-6">
            <LoginForm showDevHint={process.env.NODE_ENV === "development"} />
          </div>
        </div>
        <p className="mt-4 text-center text-sm text-[var(--muted)]">Addis Ababa · Ethiopian Birr</p>
      </div>
    </div>
  );
}
