import { cn } from "@/lib/utils";

const tones = {
  ok: "bg-ok-soft text-ok",
  low: "bg-warn-soft text-warn",
  out: "bg-danger-soft text-danger",
  accent: "bg-accent-soft text-accent",
  muted: "bg-surface-2 text-muted",
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({
  tone = "muted",
  dot = false,
  children,
  className,
}: {
  tone?: BadgeTone;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        tones[tone],
        className
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
