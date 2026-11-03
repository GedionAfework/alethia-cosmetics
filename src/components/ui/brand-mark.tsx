"use client";

import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

const sizes = {
  sm: "size-9 rounded-xl text-base",
  md: "size-10 rounded-2xl text-lg",
  lg: "size-16 rounded-[1.4rem] text-3xl",
  xl: "size-20 rounded-[1.6rem] text-4xl",
} as const;

/** The shop logo if one is uploaded, otherwise the "A" letter mark. */
export function BrandMark({ size = "md", className }: { size?: keyof typeof sizes; className?: string }) {
  const { logoUrl, t } = useI18n();

  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- served from our own route with long-lived caching
      <img
        src={logoUrl}
        alt={t.brand.name}
        className={cn("shrink-0 bg-surface object-contain ring-1 ring-line", sizes[size], className)}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center bg-gradient-to-br from-accent to-accent-strong font-extrabold text-on-accent shadow-[0_8px_20px_-10px_var(--accent)]",
        sizes[size],
        className
      )}
    >
      A
    </span>
  );
}
