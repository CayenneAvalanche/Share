import { useCallback, useId, useState } from "react";
import { Camera, ImagePlus, Loader2, X, Images } from "lucide-react";
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
  /** Extra gallery photos (after primary is set) */
  extras?: string[];
  onExtrasChange?: (urls: string[]) => void;
  maxExtras?: number;
  /** user / environment — selfie uses user-facing camera */
  facing?: "user" | "environment";
  /** Compression budget — selfie is much smaller for phone storage */
  kind?: PhotoKind;
  /**
   * Require a live camera shot before library upload is unlocked.
   * Default true for selfie/vehicle; false for docs (license can be gallery).
   */
  captureFirst?: boolean;
  required?: boolean;
  className?: string;
};

/**
 * Mobile-friendly photo picker.
 * Capture-first: Take photo → then library / add more.
 */
export function PhotoField({
  id,
  label,
  hint,
  value,
  onChange,
  extras = [],
  onExtrasChange,
  maxExtras = 6,
  facing = "environment",
  kind,
  captureFirst,
  required,
  className,
}: Props) {
  const photoKind: PhotoKind =
    kind ?? (facing === "user" ? "selfie" : "vehicle");
  const forceCameraFirst =
    captureFirst ?? (photoKind === "selfie" || photoKind === "vehicle");
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const reactId = useId();
  const cameraId = `${id}-cam-${reactId}`;
  const libraryId = `${id}-lib-${reactId}`;
  const extraId = `${id}-extra-${reactId}`;

  const processFile = useCallback(
    async (file: File | undefined | null, asExtra?: boolean) => {
      if (!file || busy) return;
      setBusy(true);
      try {
        const dataUrl = await fileToCompressedDataUrl(file, photoKind);
        if (asExtra && onExtrasChange) {
          if (extras.length >= maxExtras) {
            toast.error(`Max ${maxExtras} extra photos`);
            return;
          }
          onExtrasChange([...extras, dataUrl]);
          toast.success("Extra photo added");
          return;
        }
        onChange(dataUrl);
        if (photoKind === "selfie" && typeof window !== "undefined") {
          try {
            localStorage.setItem("share-profile-selfie-v1", dataUrl);
          } catch {
            toast.error(
              "Phone storage is full — photo may not stick after refresh.",
            );
            return;
          }
          return;
        }
        toast.success("Photo attached");
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Could not read photo";
        if (/quota|exceeded|storage/i.test(msg)) {
          toast.error(
            "Phone storage for Share is full — remove an old trip photo, then try again.",
          );
        } else {
          toast.error(msg);
        }
      } finally {
        setBusy(false);
        setDragOver(false);
      }
    },
    [busy, onChange, photoKind, extras, maxExtras, onExtrasChange],
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
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOver(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (forceCameraFirst && !value) {
      toast.message("Take a live photo first — then you can upload more");
      return;
    }
    const file = e.dataTransfer?.files?.[0] || null;
    if (!file) {
      toast.error("Drop a photo file (JPG or PNG)");
      return;
    }
    void processFile(file, Boolean(value && onExtrasChange));
  }

  const dropHandlers = {
    onDragEnter: onDragOver,
    onDragOver,
    onDragLeave,
    onDrop,
  };

  const hasPrimary = Boolean(value);
  const canLibrary = !forceCameraFirst || hasPrimary;
  const canAddExtras = hasPrimary && Boolean(onExtrasChange);

  return (
    <div className={cn("space-y-2", className)}>
      <Label>
        {label}
        {required ? " *" : ""}
      </Label>
      {hint && (
        <p className="text-xs text-[var(--color-fg-muted)]">{hint}</p>
      )}

      {hasPrimary ? (
        <div className="space-y-2">
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
              className="absolute right-2 top-2 flex size-10 items-center justify-center rounded-full bg-black/60 text-white"
              aria-label="Remove photo"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange("");
                onExtrasChange?.([]);
              }}
              disabled={busy}
            >
              <X className="size-4" />
            </button>
            {busy && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                <Loader2 className="size-8 animate-spin text-white" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label
              htmlFor={cameraId}
              className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 text-sm font-semibold active:scale-[0.99]"
            >
              <Camera className="size-4" />
              Retake
            </label>
            <label
              htmlFor={libraryId}
              className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 text-sm font-semibold active:scale-[0.99]"
            >
              <ImagePlus className="size-4" />
              From library
            </label>
          </div>

          {canAddExtras && (
            <>
              {extras.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {extras.map((src, i) => (
                    <div
                      key={`${i}-${src.slice(0, 24)}`}
                      className="relative aspect-square overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)]"
                    >
                      <img
                        src={src}
                        alt={`Extra ${i + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        className="absolute right-1 top-1 flex size-7 items-center justify-center rounded-full bg-black/65 text-white"
                        aria-label={`Remove extra photo ${i + 1}`}
                        onClick={(e) => {
                          e.preventDefault();
                          onExtrasChange?.(extras.filter((_, j) => j !== i));
                        }}
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {extras.length < maxExtras && (
                <label
                  htmlFor={extraId}
                  className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-md)] border-2 border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg-subtle)]/50 px-3 text-sm font-semibold text-[var(--color-fg)] active:scale-[0.99]"
                >
                  <Images className="size-4 text-[var(--color-primary)]" />
                  Add more photos ({extras.length}/{maxExtras})
                </label>
              )}
            </>
          )}
        </div>
      ) : (
        <div
          {...dropHandlers}
          className={cn(
            "flex min-h-[10rem] flex-col items-center justify-center gap-3 rounded-[var(--radius-md)] border-2 border-dashed px-4 py-6 text-center",
            dragOver
              ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
              : "border-[var(--color-border-strong)] bg-[var(--color-bg-subtle)]/60",
            busy && "opacity-70",
          )}
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-[var(--color-primary)]/12 text-[var(--color-primary)]">
            {busy ? (
              <Loader2 className="size-6 animate-spin" />
            ) : (
              <Camera className="size-6" />
            )}
          </div>
          <p className="text-sm font-semibold">
            {busy
              ? "Processing photo…"
              : forceCameraFirst
                ? "Take a photo first"
                : "Add a photo"}
          </p>
          <p className="max-w-xs text-xs text-[var(--color-fg-subtle)]">
            {forceCameraFirst
              ? "Live camera shot unlocks library upload and extra photos."
              : "Camera or photo library"}
          </p>
          <div
            className={cn(
              "flex w-full max-w-sm flex-col gap-2 sm:flex-row",
              forceCameraFirst && "sm:flex-col",
            )}
          >
            <label
              htmlFor={cameraId}
              className="flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 text-sm font-bold text-[var(--color-primary-fg)] active:scale-[0.99]"
            >
              <Camera className="size-4" />
              Take photo
            </label>
            {!forceCameraFirst && (
              <label
                htmlFor={libraryId}
                className="flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 text-sm font-semibold active:scale-[0.99]"
              >
                <ImagePlus className="size-4" />
                Upload
              </label>
            )}
          </div>
        </div>
      )}

      {/* Camera — always capture when possible */}
      <input
        id={cameraId}
        type="file"
        accept="image/*"
        capture={facing}
        className="sr-only"
        disabled={busy}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          void processFile(file, false);
        }}
      />
      {/* Library — no capture attribute so gallery works on iOS */}
      {canLibrary && (
        <input
          id={libraryId}
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            void processFile(file, false);
          }}
        />
      )}
      {canAddExtras && (
        <input
          id={extraId}
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            void processFile(file, true);
          }}
        />
      )}
    </div>
  );
}
