import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3.5 py-2 text-sm text-[var(--color-fg)] shadow-[var(--shadow-sm)] transition-colors placeholder:text-[var(--color-fg-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[96px] w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3.5 py-2.5 text-sm text-[var(--color-fg)] shadow-[var(--shadow-sm)] transition-colors placeholder:text-[var(--color-fg-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-sm font-medium text-[var(--color-fg)]",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex h-11 w-full appearance-none rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3.5 py-2 text-sm text-[var(--color-fg)] shadow-[var(--shadow-sm)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
