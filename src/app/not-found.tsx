import { Compass } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { getI18n } from "@/lib/i18n/server";

export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-4 px-5 text-center">
      <span className="grid size-16 place-items-center rounded-3xl bg-accent-soft text-accent">
        <Compass className="size-8" />
      </span>
      <h1 className="text-2xl font-bold">{t.common.notFound}</h1>
      <ButtonLink href="/">{t.common.goHome}</ButtonLink>
    </div>
  );
}
