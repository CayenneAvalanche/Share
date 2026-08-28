import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DashcamBadge } from "@/components/share/dashcam-badge";
import { PlatformGigsFromSeed } from "@/components/share/platform-gigs";
import {
  GIG_PLATFORM_LABELS,
  type Driver,
} from "@/lib/share/data";
import { Briefcase, ChevronDown, ChevronUp, MapPin } from "lucide-react";

export function DriverStory({
  driver,
  compact = false,
}: {
  driver: Driver;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const hasPlatforms = Boolean(driver.platforms && driver.platforms.length > 0);

  if (compact) {
    return (
      <div className="space-y-1 text-sm text-[var(--color-fg-muted)]">
        {driver.publicBio && (
          <p className="line-clamp-2 leading-snug">{driver.publicBio}</p>
        )}
        {hasPlatforms && (
          <div className="flex flex-wrap gap-1">
            {driver.platforms!
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

        {hasPlatforms && (
          <div className="space-y-2 border-t border-[var(--color-border)] pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full justify-between"
              onClick={() => setOpen((v) => !v)}
            >
              <span>
                {open ? "Hide platform history" : "Learn more · other platforms"}
              </span>
              {open ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </Button>
            {open && driver.platforms && (
              <PlatformGigsFromSeed platforms={driver.platforms} />
            )}
          </div>
        )}

        {driver.photoNotes && driver.photoNotes.length > 0 && open && (
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
