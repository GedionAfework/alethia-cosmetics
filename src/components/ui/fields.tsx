import { useId } from "react";
import { cn } from "@/lib/utils";
import { controlClassName } from "@/components/ui/input";

type FieldChrome = {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  id?: string;
};

function describedBy(hintId?: string, errorId?: string) {
  return [hintId, errorId].filter(Boolean).join(" ") || undefined;
}

function FieldFrame({
  label,
  hint,
  error,
  className,
  fieldId,
  children,
}: FieldChrome & { fieldId: string; children: React.ReactNode }) {
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)}>
      <label htmlFor={fieldId} className="text-sm font-medium text-[var(--ink)]">
        {label}
      </label>
      {children}
      {hint && (
        <p id={hintId} className="text-sm text-[var(--muted)]">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-[var(--danger)]">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField({
  label,
  hint,
  error,
  className,
  id,
  ...props
}: FieldChrome & React.InputHTMLAttributes<HTMLInputElement>) {
  const autoId = useId();
  const fieldId = id || autoId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  return (
    <FieldFrame label={label} hint={hint} error={error} className={className} fieldId={fieldId}>
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(hintId, errorId)}
        className={cn(controlClassName, error && "border-[var(--danger)]")}
        {...props}
      />
    </FieldFrame>
  );
}

export function TextAreaField({
  label,
  hint,
  error,
  className,
  id,
  ...props
}: FieldChrome & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const autoId = useId();
  const fieldId = id || autoId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  return (
    <FieldFrame label={label} hint={hint} error={error} className={className} fieldId={fieldId}>
      <textarea
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(hintId, errorId)}
        className={cn(controlClassName, "min-h-28 py-3", error && "border-[var(--danger)]")}
        {...props}
      />
    </FieldFrame>
  );
}

export function SelectField({
  label,
  hint,
  error,
  className,
  id,
  children,
  ...props
}: FieldChrome & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const autoId = useId();
  const fieldId = id || autoId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  return (
    <FieldFrame label={label} hint={hint} error={error} className={className} fieldId={fieldId}>
      <div className="relative">
        <select
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(hintId, errorId)}
          className={cn(controlClassName, "appearance-none pr-10", error && "border-[var(--danger)]")}
          {...props}
        >
          {children}
        </select>
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[var(--muted)]"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 6.5 8 10.5 12 6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
      </div>
    </FieldFrame>
  );
}

export function CheckboxField({
  label,
  hint,
  className,
  id,
  boxed = false,
  ...props
}: {
  label: string;
  hint?: string;
  className?: string;
  id?: string;
  boxed?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "id">) {
  const autoId = useId();
  const fieldId = id || autoId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  return (
    <div
      className={cn(
        "flex items-start gap-3",
        boxed &&
          "rounded-2xl border border-[var(--border)] bg-white px-3 py-3 has-[:checked]:border-[var(--accent)] has-[:checked]:bg-[var(--accent-soft)]",
        className
      )}
    >
      <input
        id={fieldId}
        type="checkbox"
        aria-describedby={hintId}
        className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]"
        {...props}
      />
      <div>
        <label htmlFor={fieldId} className="text-sm font-medium text-[var(--ink)]">
          {label}
        </label>
        {hint && (
          <p id={hintId} className="mt-0.5 text-sm text-[var(--muted)]">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}
