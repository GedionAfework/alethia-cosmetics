import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { BrandMark } from "@/components/ui/brand-mark";
import { LanguagePicker } from "@/components/settings/preference-pickers";
import { Notice } from "@/components/ui/notice";
import { defineAbilityFor, homePath } from "@/lib/auth/ability";
import { getCurrentUser } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ telegram?: string; error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect(homePath(defineAbilityFor(user)));
  const params = await searchParams;
  const { t } = await getI18n();
  const errorText = params.error ? decodeURIComponent(params.error) : "";
  const telegramError = params.telegram === "unlinked" || params.telegram === "auth";

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm animate-rise">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandMark size="lg" className="mb-4" />
          <p className="text-xs font-bold tracking-[0.25em] text-accent uppercase">{t.brand.name}</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{t.brand.tagline}</h1>
        </div>

        <div className="rounded-[2rem] bg-surface p-6 ring-1 ring-line shadow-[var(--shadow)]">
          <h2 className="mb-5 text-xl font-bold">{t.login.title}</h2>
          {telegramError && errorText && <Notice tone="danger" className="mb-4">{errorText}</Notice>}
          <Suspense fallback={null}>
            <LoginForm showDevHint={process.env.NODE_ENV === "development"} />
          </Suspense>
        </div>

        <div className="mt-6">
          <LanguagePicker />
        </div>
      </div>
    </div>
  );
}
