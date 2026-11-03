import Link from "next/link";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-accent text-on-accent shadow-[0_8px_20px_-10px_var(--accent)] hover:bg-accent-strong active:scale-[0.98]",
  secondary: "bg-surface text-ink ring-1 ring-line hover:bg-surface-2 active:scale-[0.98]",
  soft: "bg-accent-soft text-accent hover:brightness-95 active:scale-[0.98]",
  ghost: "bg-transparent text-muted hover:bg-surface-2 hover:text-ink",
  danger: "bg-danger-soft text-danger hover:brightness-95 active:scale-[0.98]",
} as const;

const sizes = {
  sm: "h-9 px-3.5 text-sm rounded-xl",
  md: "h-11 px-5 text-sm rounded-2xl",
  lg: "h-13 px-6 text-base rounded-2xl",
  icon: "size-10 rounded-xl",
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

export function buttonClassName(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(
    "inline-flex shrink-0 items-center justify-center gap-2 font-semibold whitespace-nowrap transition duration-150 select-none disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-[1.1em] [&_svg]:shrink-0",
    variants[variant],
    sizes[size],
    className
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({ variant = "primary", size = "md", className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClassName(variant, size, className)} {...props} />;
}

type ButtonLinkProps = React.ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function ButtonLink({ variant = "primary", size = "md", className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClassName(variant, size, className)} {...props} />;
}

type ButtonAnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function ButtonAnchor({ variant = "secondary", size = "md", className, ...props }: ButtonAnchorProps) {
  return <a className={buttonClassName(variant, size, className)} {...props} />;
}
