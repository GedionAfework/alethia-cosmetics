import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function List({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "divide-y divide-line overflow-hidden rounded-3xl bg-surface ring-1 ring-line shadow-[var(--shadow)]",
        className
      )}
    >
      {children}
    </div>
  );
}

const iconTones = {
  accent: "bg-accent-soft text-accent",
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  muted: "bg-surface-2 text-muted",
} as const;

export type IconTone = keyof typeof iconTones;

export function IconTile({
  icon: Icon,
  tone = "accent",
  className,
}: {
  icon: LucideIcon;
  tone?: IconTone;
  className?: string;
}) {
  return (
    <span className={cn("grid size-10 shrink-0 place-items-center rounded-2xl", iconTones[tone], className)}>
      <Icon className="size-[18px]" />
    </span>
  );
}

/** One row in a List. Becomes a link when `href` is set. */
export function ListRow({
  href,
  leading,
  title,
  subtitle,
  trailing,
  chevron,
  className,
}: {
  href?: string;
  leading?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
  chevron?: boolean;
  className?: string;
}) {
  const body = (
    <>
      {leading}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold">{title}</div>
        {subtitle && <div className="mt-0.5 truncate text-[13px] text-muted">{subtitle}</div>}
      </div>
      {trailing && <div className="flex shrink-0 items-center gap-2 text-right">{trailing}</div>}
      {(chevron ?? Boolean(href)) && <ChevronRight className="size-4 shrink-0 text-muted/60" />}
    </>
  );
  const rowClass = cn("flex items-center gap-3 px-4 py-3.5", className);

  if (href) {
    return (
      <Link href={href} className={cn(rowClass, "transition hover:bg-surface-2 active:bg-surface-2")}>
        {body}
      </Link>
    );
  }
  return <div className={rowClass}>{body}</div>;
}
