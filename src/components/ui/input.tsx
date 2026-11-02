import { cn } from "@/lib/utils";

export const controlClassName =
  "w-full min-h-11 rounded-xl border border-[var(--border)] bg-white px-3.5 text-base text-[var(--ink)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClassName, className)} {...props} />;
}
