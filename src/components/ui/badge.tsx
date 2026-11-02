import { cn } from "@/lib/utils";

const tones = {
  ok: "bg-[#e7f4ec] text-[var(--ok)]",
  low: "bg-[#f8ecdf] text-[var(--warn)]",
  out: "bg-[#fde8eb] text-[var(--danger)]",
  muted: "bg-[#f3ece7] text-[var(--muted)]",
} as const;

export function Badge({
  tone = "muted",
  children,
  className,
}: {
  tone?: keyof typeof tones;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
