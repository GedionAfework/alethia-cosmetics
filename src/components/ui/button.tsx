import Link from "next/link";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-[var(--accent)] text-white shadow-sm hover:bg-[var(--accent-dark)]",
  secondary: "border border-[var(--border)] bg-white text-[var(--ink)] hover:bg-[var(--accent-soft)]",
  ghost: "bg-transparent text-[var(--accent-dark)] hover:bg-[var(--accent-soft)]",
  danger: "bg-transparent text-[var(--danger)] hover:bg-[#fde8eb]",
} as const;

const sizes = {
  md: "min-h-11 px-4 text-sm",
  sm: "min-h-9 px-3 text-sm",
} as const;

export function buttonClassName(
  variant: keyof typeof variants = "primary",
  size: keyof typeof sizes = "md",
  className?: string
) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return <button className={buttonClassName(variant, size, className)} {...props} />;
}

type ButtonLinkProps = React.ComponentProps<typeof Link> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export function ButtonLink({ variant = "primary", size = "md", className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClassName(variant, size, className)} {...props} />;
}

type ButtonAnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export function ButtonAnchor({ variant = "secondary", size = "md", className, ...props }: ButtonAnchorProps) {
  return <a className={buttonClassName(variant, size, className)} {...props} />;
}
