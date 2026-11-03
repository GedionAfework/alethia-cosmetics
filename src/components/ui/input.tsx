import { cn } from "@/lib/utils";

export const controlClassName =
  "w-full h-12 rounded-2xl bg-surface-2 px-4 text-base text-ink ring-1 ring-transparent outline-none transition placeholder:text-muted/70 hover:ring-line focus:bg-surface focus:ring-2 focus:ring-accent";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClassName, className)} {...props} />;
}
