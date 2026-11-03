import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function PageHeader({
  title,
  eyebrow,
  back,
  actions,
}: {
  title: string;
  eyebrow?: string;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-6 animate-rise">
      {back && (
        <Link
          href={back.href}
          className="no-print mb-3 inline-flex items-center gap-1 rounded-full py-1 pr-3 pl-1.5 text-sm font-semibold text-muted transition hover:bg-surface-2 hover:text-ink"
        >
          <ChevronLeft className="size-4" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && <p className="mb-1 text-sm font-semibold text-accent">{eyebrow}</p>}
          <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight sm:text-4xl">{title}</h1>
        </div>
        {actions && <div className="no-print flex flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}
