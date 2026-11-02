import Link from "next/link";
import { Card } from "@/components/ui/card";

export function Stat({
  label,
  value,
  href,
  detail,
}: {
  label: string;
  value: string;
  href?: string;
  detail?: string;
}) {
  const body = (
    <>
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="mt-3 font-display text-3xl leading-none tracking-tight">{value}</p>
      {detail && <p className="mt-2 text-sm text-[var(--muted)]">{detail}</p>}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="block rounded-3xl focus-visible:outline-offset-4">
        <Card className="h-full transition duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)]">{body}</Card>
      </Link>
    );
  }

  return <Card>{body}</Card>;
}
