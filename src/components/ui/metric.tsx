export function MetricGrid({
  items,
}: {
  items: { label: string; value: string }[];
}) {
  return (
    <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl bg-[var(--bg)] px-3 py-2.5">
          <dt className="text-xs text-[var(--muted)]">{item.label}</dt>
          <dd className="mt-0.5 font-semibold">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
