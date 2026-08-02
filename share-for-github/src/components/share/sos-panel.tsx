import { useState } from "react";
import { AlertTriangle, Mic, Phone, Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useShareStore } from "@/lib/share/store";

/**
 * In-trip safety: SOS, emergency contact, audio note.
 * LA is generally one-party consent for audio — still show clear notice.
 * Not legal advice.
 */
export function SosPanel({ tripLabel }: { tripLabel?: string }) {
  const emergencyName = useShareStore((s) => s.emergencyContactName);
  const emergencyPhone = useShareStore((s) => s.emergencyContactPhone);
  const pushNotification = useShareStore((s) => s.pushNotification);
  const [recording, setRecording] = useState(false);
  const [sosArmed, setSosArmed] = useState(false);

  function triggerSos() {
    setSosArmed(true);
    pushNotification(
      `SOS armed${tripLabel ? ` · ${tripLabel}` : ""} — Share Ops + emergency contact notified (demo)`,
    );
    toast.error("SOS sent (demo)", {
      description: emergencyPhone
        ? `Would alert ${emergencyName || "contact"} at ${emergencyPhone}`
        : "Add an emergency contact under You for real pilots.",
      duration: 6000,
    });
  }

  function toggleAudio() {
    if (!recording) {
      setRecording(true);
      toast.message("Audio note started (demo)", {
        description:
          "Louisiana is generally a one-party consent state — you can record conversations you are part of. Still tell the other party when possible. Not legal advice.",
        duration: 8000,
      });
      pushNotification("In-trip audio note started (demo · local only)");
    } else {
      setRecording(false);
      toast.success("Audio note saved to trip log (demo)");
      pushNotification("Audio note saved on trip (demo)");
    }
  }

  return (
    <Card className="border-[var(--color-danger,#b42318)]/30 bg-[#b42318]/5">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start gap-2">
          <Shield className="mt-0.5 size-5 shrink-0 text-[#b42318]" />
          <div>
            <p className="font-semibold text-[var(--color-fg)]">
              In-trip safety
            </p>
            <p className="text-xs text-[var(--color-fg-muted)]">
              Use only if something feels wrong. Demo alerts stay in this app —
              live pilot will text Share Ops + your contact.
            </p>
          </div>
        </div>

        <Button
          className="w-full bg-[#b42318] text-white hover:bg-[#912018]"
          size="lg"
          onClick={triggerSos}
        >
          <AlertTriangle className="size-4" />
          {sosArmed ? "SOS sent (demo)" : "SOS — I need help"}
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAudio}
            className={recording ? "border-[#b42318] text-[#b42318]" : ""}
          >
            <Mic className="size-4" />
            {recording ? "Stop audio" : "Record audio"}
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
          Audio: Louisiana is generally <strong>one-party consent</strong> (you
          can record if you are in the conversation). Federal and other-state
          rules can differ on cross-border trips. This is not legal advice —
          when in doubt, tell the driver you are recording.
        </p>
      </CardContent>
    </Card>
  );
}
