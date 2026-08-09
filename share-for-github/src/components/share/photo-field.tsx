import { useCallback, useState } from "react";
import { Camera, ImagePlus, Loader2, X } from "lucide-react";
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
 * Mobile-friendly photo picker: camera + library + drag-and-drop, live preview.
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
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const processFile = useCallback(
    async (file: File | undefined | null) => {
      if (!file || busy) return;
      setBusy(true);
      try {
        const dataUrl = await fileToCompressedDataUrl(file, photoKind);
        onChange(dataUrl);
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
      } finally {
        setBusy(false);
        setDragOver(false);
      }
    },
    [busy, onChange, photoKind],
  );

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    setDragOver(true);
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    // Only clear when leaving the drop zone (not child nodes)
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOver(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file =
      e.dataTransfer?.files?.[0] ||
      // some desktops put a file URL in items
      null;
    if (!file) {
      toast.error("Drop a photo file (JPG or PNG)");
      return;
    }
    void processFile(file);
  }

  const dropHandlers = {
    onDragEnter: onDragOver,
    onDragOver,
    onDragLeave,
    onDrop,
  };

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
        <div
          className={cn(
            "relative overflow-hidden rounded-[var(--radius-md)] border bg-[var(--color-bg-subtle)]",
            dragOver
              ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/30"
              : "border-[var(--color-border)]",
          )}
          {...dropHandlers}
        >
          <img
            src={value}
            alt={label}
            className="aspect-[4/3] w-full object-cover"
            draggable={false}
          />
          <button
            type="button"
            className="absolute right-2 top-2 flex size-9 items-center justify-center rounded-full bg-black/60 text-white"
            aria-label="Remove photo"
            onClick={() => onChange("")}
            disabled={busy}
          >
            <X className="size-4" />
          </button>
          <label
            htmlFor={id}
            className="absolute bottom-2 left-2 flex cursor-pointer items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm"
          >
            <Camera className="size-3.5" />
            {busy ? "Working…" : "Retake / drop"}
          </label>
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/35">
              <Loader2 className="size-8 animate-spin text-white" />
            </div>
          )}
        </div>
      ) : (
        <label
          htmlFor={id}
          {...dropHandlers}
          className={cn(
            "flex min-h-[9.5rem] cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-md)] border-2 border-dashed px-4 py-6 text-center transition-colors",
            dragOver
              ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
              : "border-[var(--color-border-strong)] bg-[var(--color-bg-subtle)]/60 active:bg-[var(--color-bg-subtle)]",
            busy && "pointer-events-none opacity-70",
          )}
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-[var(--color-primary)]/12 text-[var(--color-primary)]">
            {busy ? (
              <Loader2 className="size-6 animate-spin" />
            ) : (
              <ImagePlus className="size-6" />
            )}
          </div>
          <span className="text-sm font-semibold">
            {busy
              ? "Processing photo…"
              : dragOver
                ? "Drop photo here"
                : "Tap, upload, or drop a photo"}
          </span>
          <span className="text-xs text-[var(--color-fg-subtle)]">
            Camera, photo library, or drag from desktop
          </span>
        </label>
      )}
      <input
        id={id}
        type="file"
        accept="image/*"
        /* Only hint mobile camera; omit on desktop-style so drag/upload stay reliable */
        {...(typeof navigator !== "undefined" &&
        /Mobi|Android|iPhone/i.test(navigator.userAgent)
          ? { capture: facing }
          : {})}
        className="sr-only"
        disabled={busy}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          void processFile(file);
        }}
      />
    </div>
  );
}
