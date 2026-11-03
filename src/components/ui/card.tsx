import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  as: Tag = "section",
}: {
  className?: string;
  children: React.ReactNode;
  as?: "section" | "div" | "article";
}) {
  return (
    <Tag className={cn("rounded-3xl bg-surface p-5 ring-1 ring-line shadow-[var(--shadow)]", className)}>
      {children}
    </Tag>
  );
}

export function SectionTitle({
  children,
  action,
  className,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-3 px-1", className)}>
      <h2 className="text-[13px] font-semibold tracking-wide text-muted uppercase">{children}</h2>
      {action}
    </div>
  );
}
