import { cn } from "@/lib/utils";
import { controlClassName } from "@/components/ui/input";

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlClassName, "min-h-24 py-2.5", className)} {...props} />;
}
