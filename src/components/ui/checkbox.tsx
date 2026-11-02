export function Checkbox({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex items-center gap-2.5 text-sm font-medium text-[var(--ink)]">
      <input
        type="checkbox"
        className="size-4 rounded border-[var(--border)] accent-[var(--accent)]"
        {...props}
      />
      {label}
    </label>
  );
}
