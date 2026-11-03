import { cn } from "@/lib/utils";

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0][0], parts[parts.length - 1][0]] : [name.trim()[0] || "?"];
  return letters.join("").toUpperCase();
}

const sizes = {
  sm: "size-9 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-lg",
} as const;

export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent to-accent-strong font-bold text-on-accent",
        sizes[size],
        className
      )}
    >
      {initials(name)}
    </span>
  );
}
