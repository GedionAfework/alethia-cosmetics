import { CircleCheck, TriangleAlert, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const tones = {
  ok: { className: "bg-ok-soft text-ok", Icon: CircleCheck },
  danger: { className: "bg-danger-soft text-danger", Icon: TriangleAlert },
  info: { className: "bg-accent-soft text-accent", Icon: Sparkles },
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
  const { className: toneClass, Icon } = tones[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("animate-rise flex items-start gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium", toneClass, className)}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
