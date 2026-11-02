import { cn } from "@/lib/utils";
import { controlClassName } from "@/components/ui/input";

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(controlClassName, "appearance-none pr-10", className)}
        {...props}
      >
        {children}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[var(--muted)]"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 6.5 8 10.5 12 6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
    </div>
  );
}
