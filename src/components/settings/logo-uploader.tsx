"use client";

import { useRef, useState, useTransition } from "react";
import { ImageUp, LoaderCircle, Trash2 } from "lucide-react";
import { removeLogoAction, uploadLogoAction } from "@/app/actions/settings";
import { BrandMark } from "@/components/ui/brand-mark";
import { Button, buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { useI18n } from "@/lib/i18n/client";
import { haptic } from "@/lib/telegram/client";
import { cn } from "@/lib/utils";

const MAX_SIDE = 512;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

/** Scale the image down so the longest side is at most 512px. Keeps transparency. */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.9));
  // Browsers without WebP encoding hand back PNG, which is fine too.
  return blob ?? file;
}

export function LogoUploader() {
  const { t, err, logoUrl } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    if (!ACCEPTED.includes(file.type)) {
      setError(err("Use a PNG, JPG or WebP image."));
      return;
    }
    startTransition(async () => {
      try {
        const blob = await shrink(file);
        const form = new FormData();
        form.set("logo", blob, "logo");
        const result = await uploadLogoAction(form);
        if (!result.ok) {
          haptic.notify("error");
          setError(err(result.error || "Could not save the logo."));
          return;
        }
        haptic.notify("success");
      } catch {
        setError(err("Use a PNG, JPG or WebP image."));
      }
    });
  }

  function onRemove() {
    setError("");
    startTransition(async () => {
      const result = await removeLogoAction();
      if (!result.ok) setError(err(result.error || "Could not save the logo."));
    });
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <BrandMark size="xl" />
          {pending && (
            <span className="absolute inset-0 grid place-items-center rounded-[1.6rem] bg-surface/70">
              <LoaderCircle className="size-6 animate-spin text-accent" />
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-wrap gap-2">
          <label className={cn(buttonClassName("primary", "md"), "cursor-pointer", pending && "pointer-events-none opacity-45")}>
            <ImageUp />
            {logoUrl ? t.settings.logoChange : t.settings.logoUpload}
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED.join(",")}
              className="sr-only"
              onChange={onPick}
              disabled={pending}
            />
          </label>
          {logoUrl && (
            <Button variant="danger" onClick={onRemove} disabled={pending} aria-label={t.common.remove}>
              <Trash2 />
              <span className="hidden sm:inline">{t.common.remove}</span>
            </Button>
          )}
        </div>
      </div>
      {error && <Notice tone="danger">{error}</Notice>}
    </Card>
  );
}
