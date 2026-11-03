import { Sparkles, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Empty({
  children,
  icon: Icon = Sparkles,
  className,
}: {
  children: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-3xl border border-dashed border-line px-4 py-10 text-center text-sm font-medium text-muted",
        className
      )}
    >
      <span className="grid size-11 place-items-center rounded-2xl bg-surface-2">
        <Icon className="size-5" />
      </span>
      {children}
    </div>
  );
}
