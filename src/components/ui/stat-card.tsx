import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { IconTile, type IconTone } from "@/components/ui/list";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon,
  tone = "accent",
  href,
  highlight = false,
  className,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: IconTone;
  href?: string;
  highlight?: boolean;
  className?: string;
}) {
  const body = (
    <div
      className={cn(
        "flex h-full flex-col justify-between gap-5 rounded-3xl p-4 ring-1 shadow-[var(--shadow)] transition duration-200 sm:p-5",
        highlight
          ? "bg-accent text-on-accent ring-transparent"
          : "bg-surface ring-line",
        href && "hover:-translate-y-0.5 active:scale-[0.99]"
      )}
    >
      <IconTile
        icon={icon}
        tone={tone}
        className={highlight ? "bg-white/20 text-on-accent" : undefined}
      />
      <div className="min-w-0">
        <p className={cn("truncate text-[13px] font-medium", highlight ? "text-on-accent/80" : "text-muted")}>
          {label}
        </p>
        <p className="tabular mt-1 truncate text-xl font-bold tracking-tight sm:text-2xl">{value}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className={cn("block rounded-3xl", className)}>
        {body}
      </Link>
    );
  }
  return <div className={className}>{body}</div>;
}
