import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-primary)] text-[var(--color-primary-fg)] hover:bg-[var(--color-primary-hover)] shadow-[var(--shadow-sm)]",
        secondary:
          "bg-[var(--color-bg-subtle)] text-[var(--color-fg)] hover:bg-[var(--color-border)]",
        outline:
          "border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)]",
        ghost: "text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)]",
        accent:
          "bg-[var(--color-accent)] text-[var(--color-accent-fg)] hover:opacity-90 shadow-[var(--shadow-sm)]",
        inverse:
          "bg-[var(--color-bg-elevated)] text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)]",
        danger:
          "bg-[var(--color-danger)] text-white hover:opacity-90",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-[var(--radius-sm)] px-3 text-xs",
        lg: "h-12 rounded-[var(--radius-lg)] px-6 text-base",
        icon: "h-11 w-11",
        xl: "h-14 rounded-[var(--radius-lg)] px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
