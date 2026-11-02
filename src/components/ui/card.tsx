import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-[var(--border)] bg-white p-5 shadow-[0_12px_40px_-28px_rgba(36,24,28,0.35)]",
        className
      )}
    >
      {children}
    </section>
  );
}
