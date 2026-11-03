import { useId } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { controlClassName } from "@/components/ui/input";

type FieldChrome = {
  label: string;
  error?: string;
  className?: string;
  id?: string;
};

function FieldFrame({
  label,
  error,
  className,
  fieldId,
  children,
}: FieldChrome & { fieldId: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex w-full min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={fieldId} className="px-1 text-[13px] font-semibold text-muted">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${fieldId}-error`} className="px-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField({
  label,
  error,
  className,
  id,
  ...props
}: FieldChrome & React.InputHTMLAttributes<HTMLInputElement>) {
  const autoId = useId();
  const fieldId = id || autoId;
  return (
    <FieldFrame label={label} error={error} className={className} fieldId={fieldId}>
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={cn(controlClassName, error && "ring-2 ring-danger")}
        {...props}
      />
    </FieldFrame>
  );
}

export function TextAreaField({
  label,
  error,
  className,
  id,
  ...props
}: FieldChrome & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const autoId = useId();
  const fieldId = id || autoId;
  return (
    <FieldFrame label={label} error={error} className={className} fieldId={fieldId}>
      <textarea
        id={fieldId}
        aria-invalid={error ? true : undefined}
        className={cn(controlClassName, "h-auto min-h-24 py-3", error && "ring-2 ring-danger")}
        {...props}
      />
    </FieldFrame>
  );
}

export function SelectField({
  label,
  error,
  className,
  id,
  children,
  ...props
}: FieldChrome & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const autoId = useId();
  const fieldId = id || autoId;
  return (
    <FieldFrame label={label} error={error} className={className} fieldId={fieldId}>
      <div className="relative">
        <select
          id={fieldId}
          aria-invalid={error ? true : undefined}
          className={cn(controlClassName, "appearance-none pr-11", error && "ring-2 ring-danger")}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted"
        />
      </div>
    </FieldFrame>
  );
}

/** A labelled on/off switch backed by a real checkbox, so it works in plain forms. */
export function SwitchField({
  label,
  className,
  id,
  ...props
}: {
  label: string;
  className?: string;
  id?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "id">) {
  const autoId = useId();
  const fieldId = id || autoId;
  return (
    <label
      htmlFor={fieldId}
      className={cn(
        "flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-surface-2 px-4 py-3.5 text-[15px] font-medium transition hover:brightness-[0.98] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50",
        className
      )}
    >
      <span className="min-w-0">{label}</span>
      <input id={fieldId} type="checkbox" className="peer sr-only" {...props} />
      <span
        aria-hidden
        className="relative h-7 w-12 shrink-0 rounded-full bg-line transition peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5"
      />
    </label>
  );
}

/** Search input with a leading icon. Pass `name` to use it inside a GET form. */
export function SearchInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn("relative min-w-0 flex-1", className)}>
      <Search aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-muted" />
      <input type="search" className={cn(controlClassName, "pl-11")} {...props} />
    </div>
  );
}
