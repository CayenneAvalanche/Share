import { cn } from "@/lib/utils";

export function ShareMark({
  className,
  inverted = false,
}: {
  className?: string;
  inverted?: boolean;
}) {
  const stroke = inverted ? "var(--color-fg-inverse)" : "var(--color-fg)";
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-10", className)}
      aria-hidden
    >
      <path
        d="M18 14c8-6 22-4 26 6 3 8-2 14-10 16-8 2-12 6-10 14 2 8 14 12 24 6"
        stroke={stroke}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ShareWordmark({
  className,
  inverted = false,
}: {
  className?: string;
  inverted?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <ShareMark inverted={inverted} className="size-8" />
      <span
        className={cn(
          "font-display text-xl font-semibold tracking-tight",
          inverted ? "text-[var(--color-fg-inverse)]" : "text-[var(--color-fg)]",
        )}
      >
        Share
      </span>
    </div>
  );
}
