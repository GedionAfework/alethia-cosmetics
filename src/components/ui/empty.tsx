export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-3xl border border-dashed border-[var(--border)] bg-white/70 px-4 py-10 text-center text-[var(--muted)]">
      {children}
    </p>
  );
}
