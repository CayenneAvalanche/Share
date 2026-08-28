import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  parsePlatformsText,
  type ParsedPlatform,
} from "@/lib/share/parse-platforms";
import {
  GIG_PLATFORM_LABELS,
  type PlatformGig,
} from "@/lib/share/data";

function GigCard({ g }: { g: ParsedPlatform }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-[var(--color-fg)]">{g.name}</p>
          <Badge variant={g.active ? "success" : "outline"} className="text-[10px]">
            {g.active ? "Active" : "Past"}
          </Badge>
        </div>
        <p className="mt-0.5 text-xs text-[var(--color-fg-muted)]">
          {[
            g.years != null && g.years !== ""
              ? `${g.years} yr${g.years === "1" ? "" : "s"}`
              : null,
            g.trips
              ? `~${Number(g.trips).toLocaleString()} trips`
              : null,
          ]
            .filter(Boolean)
            .join(" · ") || "Details not shared"}
        </p>
      </div>
      {typeof g.rating === "number" && (
        <span className="inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold tabular-nums">
          <Star className="size-3.5 fill-[var(--color-accent)] text-[var(--color-accent)]" />
          {g.rating.toFixed(2)}
        </span>
      )}
    </div>
  );
}

export function PlatformGigsFromText({
  text,
  title = "Other platforms",
}: {
  text?: string | null;
  title?: string;
}) {
  const gigs = parsePlatformsText(text);
  if (gigs.length === 0) return null;
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-[var(--color-fg-subtle)]">
          Self-reported on application · not pulled live from Uber/Lyft
        </p>
      </div>
      <div className="space-y-2">
        {gigs.map((g) => (
          <GigCard key={`${g.name}-${g.years}-${g.active}`} g={g} />
        ))}
      </div>
    </div>
  );
}

export function PlatformGigsFromSeed({
  platforms,
}: {
  platforms: PlatformGig[];
}) {
  if (!platforms.length) return null;
  const gigs: ParsedPlatform[] = platforms.map((p) => ({
    name: GIG_PLATFORM_LABELS[p.platform] || p.platform,
    active: p.active,
    years: String(p.years),
    trips: String(p.tripsApprox),
    rating: p.rating,
  }));
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-semibold">Other platforms</p>
        <p className="text-xs text-[var(--color-fg-subtle)]">
          Self-reported · not pulled live from Uber/Lyft
        </p>
      </div>
      <div className="space-y-2">
        {gigs.map((g) => (
          <GigCard key={`${g.name}-${g.years}-${g.active}`} g={g} />
        ))}
      </div>
    </div>
  );
}
