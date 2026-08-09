import { Camera, ImagePlus, X } from "lucide-react";
import { Label } from "@/components/ui/input";
import {
  fileToCompressedDataUrl,
  type PhotoKind,
} from "@/lib/share/image";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (dataUrl: string) => void;
  /** user / environment — selfie uses user-facing camera */
  facing?: "user" | "environment";
  /** Compression budget — selfie is much smaller for phone storage */
  kind?: PhotoKind;
  required?: boolean;
  className?: string;
};

/**
 * Mobile-friendly photo picker: camera + library, live preview, clear.
 */
export function PhotoField({
  id,
  label,
  hint,
  value,
  onChange,
  facing = "environment",
  kind,
  required,
  className,
}: Props) {
  const photoKind: PhotoKind =
    kind ?? (facing === "user" ? "selfie" : "vehicle");

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>
        {label}
        {required ? " *" : ""}
      </Label>
      {hint && (
        <p className="text-xs text-[var(--color-fg-muted)]">{hint}</p>
      )}
      {value ? (
        <div className="relative overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
          <img
            src={value}
            alt={label}
            className="aspect-[4/3] w-full object-cover"
          />
          <button
            type="button"
            className="absolute right-2 top-2 flex size-9 items-center justify-center rounded-full bg-black/60 text-white"
            aria-label="Remove photo"
            onClick={() => onChange("")}
          >
            <X className="size-4" />
          </button>
          <label
            htmlFor={id}
            className="absolute bottom-2 left-2 flex cursor-pointer items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm"
          >
            <Camera className="size-3.5" />
            Retake
          </label>
        </div>
      ) : (
        <label
          htmlFor={id}
          className="flex min-h-[9.5rem] cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-md)] border-2 border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg-subtle)]/60 px-4 py-6 text-center transition-colors active:bg-[var(--color-bg-subtle)]"
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-[var(--color-primary)]/12 text-[var(--color-primary)]">
            <ImagePlus className="size-6" />
          </div>
          <span className="text-sm font-semibold">Tap to take or upload photo</span>
          <span className="text-xs text-[var(--color-fg-subtle)]">
            Camera or photo library
          </span>
        </label>
      )}
      <input
        id={id}
        type="file"
        accept="image/*"
        capture={facing}
        className="sr-only"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          try {
            const dataUrl = await fileToCompressedDataUrl(file, photoKind);
            onChange(dataUrl);
            // For profile selfies, verify a durable write path exists
            if (photoKind === "selfie" && typeof window !== "undefined") {
              try {
                localStorage.setItem("share-profile-selfie-v1", dataUrl);
              } catch {
                toast.error(
                  "Phone storage is full — photo may not stick after refresh. Delete old trip photos and try again.",
                );
                return;
              }
              // Parent (You tab) shows cloud-sync toast
              return;
            }
            toast.success("Photo attached");
          } catch (err) {
            const msg =
              err instanceof Error ? err.message : "Could not read photo";
            if (/quota|exceeded|storage/i.test(msg)) {
              toast.error(
                "Phone storage for Share is full — remove an old trip photo or vehicle, then try again.",
              );
            } else {
              toast.error(msg);
            }
          }
        }}
      />
    </div>
  );
}
