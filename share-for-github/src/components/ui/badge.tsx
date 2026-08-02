import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-[var(--radius-full)] px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-primary)]/12 text-[var(--color-primary)]",
        secondary:
          "bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)]",
        outline:
          "border border-[var(--color-border)] text-[var(--color-fg-muted)]",
        accent: "bg-[var(--color-accent)]/12 text-[var(--color-accent)]",
        success:
          "bg-[var(--color-success)]/12 text-[var(--color-success)]",
        warning:
          "bg-[var(--color-warning)]/12 text-[var(--color-warning)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
