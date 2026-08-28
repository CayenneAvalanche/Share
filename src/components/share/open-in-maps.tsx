import { MapPin } from "lucide-react";
import { openInMapsUrl } from "@/lib/share/maps";
import { cn } from "@/lib/utils";

/** Small link/button that opens the address in Apple or Google Maps. */
export function OpenInMaps({
  address,
  label = "Open in Maps",
  className,
  compact,
}: {
  address: string;
  label?: string;
  className?: string;
  compact?: boolean;
}) {
  const trimmed = address?.trim();
  if (!trimmed || trimmed.length < 3) return null;
  const href = openInMapsUrl(trimmed);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline",
        compact ? "text-xs" : "text-sm",
        className,
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <MapPin className={compact ? "size-3.5" : "size-4"} />
      {label}
    </a>
  );
}
