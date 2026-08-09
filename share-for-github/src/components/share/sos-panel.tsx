import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Mic, Phone, Shield, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useShareStore } from "@/lib/share/store";
import { cn } from "@/lib/utils";

/**
 * In-trip safety: SOS, emergency contact, audio note.
 * LA is generally one-party consent for audio — still show clear notice.
 * Not legal advice.
 */
export function SosPanel({
  tripLabel,
  compact,
}: {
  tripLabel?: string;
  compact?: boolean;
}) {
  const emergencyName = useShareStore((s) => s.emergencyContactName);
  const emergencyPhone = useShareStore((s) => s.emergencyContactPhone);
  const pushNotification = useShareStore((s) => s.pushNotification);
  const [recording, setRecording] = useState(false);
  const [sosArmed, setSosArmed] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      try {
        mediaRef.current?.stop();
      } catch {
        /* ignore */
      }
    };
  }, []);

  function triggerSos() {
    setSosArmed(true);
    pushNotification(
      `SOS armed${tripLabel ? ` · ${tripLabel}` : ""} — Share Ops + emergency contact notified (demo)`,
    );
    toast.error("SOS sent", {
      description: emergencyPhone
        ? `Would alert ${emergencyName || "contact"} at ${emergencyPhone}`
        : "Add an emergency contact under You for real pilots.",
      duration: 6000,
    });
  }

  async function startAudio() {
    toast.message("Recording audio for this trip", {
      description:
        "Louisiana is generally a one-party consent state — you can record conversations you are part of. Still tell the other party when possible. Not legal advice.",
      duration: 7000,
    });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        // Keep on device for pilot — download so founder has a copy
        try {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `share-trip-audio-${Date.now()}.webm`;
          a.click();
          URL.revokeObjectURL(url);
        } catch {
          /* ignore */
        }
        pushNotification("Audio note saved on this phone");
        toast.success("Audio saved on this phone");
      };
      mediaRef.current = rec;
      rec.start(1000);
      setRecording(true);
      setRecSeconds(0);
      timerRef.current = window.setInterval(
        () => setRecSeconds((s) => s + 1),
        1000,
      );
      pushNotification("In-trip audio recording started");
    } catch {
      // Fallback demo mode if mic denied
      setRecording(true);
      setRecSeconds(0);
      timerRef.current = window.setInterval(
        () => setRecSeconds((s) => s + 1),
        1000,
      );
      toast.message("Mic blocked — timer-only demo note", {
        description: "Allow microphone in browser settings for real audio.",
      });
    }
  }

  function stopAudio() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    try {
      if (mediaRef.current && mediaRef.current.state !== "inactive") {
        mediaRef.current.stop();
      } else {
        toast.success("Audio note stopped");
        pushNotification("Audio note stopped");
      }
    } catch {
      toast.success("Audio note stopped");
    }
    mediaRef.current = null;
    setRecording(false);
  }

  function toggleAudio() {
    if (!recording) void startAudio();
    else stopAudio();
  }

  const mm = String(Math.floor(recSeconds / 60)).padStart(2, "0");
  const ss = String(recSeconds % 60).padStart(2, "0");

  return (
    <Card
      className={cn(
        "border-[#b42318]/35 bg-[#b42318]/[0.06]",
        compact && "shadow-none",
      )}
    >
      <CardContent className={cn("space-y-3", compact ? "p-3" : "p-4")}>
        <div className="flex items-start gap-2">
          <Shield className="mt-0.5 size-5 shrink-0 text-[#b42318]" />
          <div>
            <p className="font-semibold text-[var(--color-fg)]">
              In-trip safety
            </p>
            {!compact && (
              <p className="text-xs text-[var(--color-fg-muted)]">
                Only if something feels wrong. SOS is demo until live ops
                wiring — still tap it so the trip log has a mark.
              </p>
            )}
          </div>
        </div>

        <Button
          className="w-full bg-[#b42318] text-white hover:bg-[#912018]"
          size={compact ? "default" : "lg"}
          onClick={triggerSos}
        >
          <AlertTriangle className="size-4" />
          {sosArmed ? "SOS sent" : "SOS — I need help"}
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAudio}
            className={recording ? "border-[#b42318] text-[#b42318]" : ""}
          >
            {recording ? (
              <Square className="size-4" />
            ) : (
              <Mic className="size-4" />
            )}
            {recording ? `Stop ${mm}:${ss}` : "Record audio"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild={Boolean(emergencyPhone)}
            onClick={() => {
              if (!emergencyPhone) {
                toast.message("Add emergency contact under You");
              }
            }}
          >
            {emergencyPhone ? (
              <a href={`tel:${emergencyPhone.replace(/\D/g, "")}`}>
                <Phone className="size-4" />
                Call contact
              </a>
            ) : (
              <>
                <Phone className="size-4" />
                No contact yet
              </>
            )}
          </Button>
        </div>

        <p className="text-[10px] leading-relaxed text-[var(--color-fg-subtle)]">
          Audio: LA is generally <strong>one-party consent</strong>. Not legal
          advice — tell the other party when you can.
        </p>
      </CardContent>
    </Card>
  );
}
