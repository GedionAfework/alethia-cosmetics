"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-4 px-5 text-center">
      <span className="grid size-16 place-items-center rounded-3xl bg-danger-soft text-danger">
        <TriangleAlert className="size-8" />
      </span>
      <h1 className="text-2xl font-bold">{t.common.error}</h1>
      <Button onClick={() => reset()}>{t.common.tryAgain}</Button>
    </div>
  );
}
