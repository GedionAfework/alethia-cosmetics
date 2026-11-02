import { cn } from "@/lib/utils";

const tones = {
  ok: "bg-[#e7f4ec] text-[var(--ok)]",
  danger: "bg-[#fde8eb] text-[var(--danger)]",
  info: "bg-white text-[var(--ink)]",
} as const;

export function Notice({
  tone = "info",
  children,
  className,
}: {
  tone?: keyof typeof tones;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("rounded-xl px-4 py-3 text-sm", tones[tone], className)}>{children}</p>
  );
}
