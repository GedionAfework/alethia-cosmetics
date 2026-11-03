"use client";

import { cn } from "@/lib/utils";
import { controlClassName } from "@/components/ui/input";

/** An input that submits its form as soon as the value changes (date and year pickers). */
export function AutoSubmitInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(controlClassName, "w-auto font-semibold", className)}
      onChange={(event) => {
        if (event.currentTarget.value) event.currentTarget.form?.requestSubmit();
      }}
    />
  );
}
