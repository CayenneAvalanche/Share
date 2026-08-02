import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DashcamBadge } from "@/components/share/dashcam-badge";
import {
  GIG_PLATFORM_LABELS,
  type Driver,
  type PlatformGig,
} from "@/lib/share/data";
import { Briefcase, MapPin, Star } from "lucide-react";

function PlatformRow({ g }: { g: PlatformGig }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm">
      <div>
        <p className="font-medium">{GIG_PLATFORM_LABELS[g.platform]}</p>
        <p className="text-xs text-[var(--color-fg-muted)]">
          {g.years} yr{g.years === 1 ? "" : "s"} · ~{g.tripsApprox.toLocaleString()}{" "}
          trips
          {g.active ? " · active" : " · past"}
        </p>
      </div>
      {typeof g.rating === "number" && (
        <span className="inline-flex items-center gap-0.5 text-sm font-semibold">
          <Star className="size-3.5 fill-[var(--color-accent)] text-[var(--color-accent)]" />
          {g.rating.toFixed(2)}
        </span>
      )}
    </div>
  );
}

export function DriverStory({
  driver,
  compact = false,
}: {
  driver: Driver;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="space-y-1 text-sm text-[var(--color-fg-muted)]">
        {driver.publicBio && (
          <p className="line-clamp-2 leading-snug">{driver.publicBio}</p>
        )}
        {driver.platforms && driver.platforms.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {driver.platforms
              .filter((p) => p.active)
              .map((p) => (
                <Badge key={p.platform} variant="outline" className="text-[10px]">
                  {GIG_PLATFORM_LABELS[p.platform]}
                  {p.rating ? ` ${p.rating}` : ""}
                </Badge>
              ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div>
          <h3 className="font-display text-lg font-semibold">
            Know your driver
          </h3>
          <p className="text-xs text-[var(--color-fg-subtle)]">
            Self-reported on application · interview verified later
          </p>
        </div>

        {driver.publicBio && (
          <p className="text-sm leading-relaxed text-[var(--color-fg-muted)]">
            {driver.publicBio}
          </p>
        )}

        <div className="flex flex-wrap gap-2 text-xs text-[var(--color-fg-muted)]">
          {driver.hometown && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              {driver.hometown}
            </span>
          )}
          {driver.otherJob && (
            <span className="inline-flex items-center gap-1">
              <Briefcase className="size-3.5" />
              {driver.otherJob}
            </span>
          )}
          <DashcamBadge
            hasDashcam={driver.hasDashcam}
            note={driver.dashcamNote}
            size="md"
          />
        </div>

        {driver.platforms && driver.platforms.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold">Other platforms</p>
            <p className="text-xs text-[var(--color-fg-subtle)]">
              Years, trip volume, and ratings as shared by the driver (not pulled
              live from Uber/Lyft).
            </p>
            {driver.platforms.map((g) => (
              <PlatformRow key={g.platform + g.years} g={g} />
            ))}
          </div>
        )}

        {driver.photoNotes && driver.photoNotes.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold">Photos / vehicle notes</p>
            <div className="grid grid-cols-2 gap-2">
              {driver.photoNotes.map((note, i) => (
                <div
                  key={i}
                  className="flex aspect-[4/3] flex-col justify-end rounded-[var(--radius-md)] bg-gradient-to-br from-[#1a3d2a] to-[#3d8f5f] p-2 text-[10px] font-medium text-white"
                >
                  {note}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
