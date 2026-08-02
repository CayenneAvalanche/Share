import { Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function DashcamBadge({
  hasDashcam,
  note,
  size = "sm",
}: {
  hasDashcam: boolean;
  note?: string;
  size?: "sm" | "md";
}) {
  if (!hasDashcam) return null;

  return (
    <Badge
      variant="default"
      title={
        note
          ? `Audio & video may be recorded. ${note}`
          : "Driver dashcam on — audio/video may be recorded for safety"
      }
      className={`gap-1 border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/15 text-[var(--color-primary)] ${
        size === "md" ? "px-2.5 py-1 text-xs" : ""
      }`}
    >
      <Video className={size === "md" ? "size-3.5" : "size-3"} />
      Dashcam
    </Badge>
  );
}

export function DashcamBubble({ hasDashcam }: { hasDashcam?: boolean }) {
  if (!hasDashcam) return null;
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-full bg-[var(--color-primary)]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-primary)]"
      title="Driver records with dashcam (audio/video may be on)"
    >
      <Video className="size-3" />
      Cam
    </span>
  );
}
