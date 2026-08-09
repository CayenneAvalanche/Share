import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { listVolunteerRidesFn } from "@/lib/share/server-fns";

const SEEN_KEY = "share-vol-alert-seen-v1";

function loadSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveSeen(ids: Set<string>) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...ids].slice(-200)));
  } catch {
    /* ignore */
  }
}

function beep() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "square";
    o.frequency.value = 880;
    g.gain.value = 0.08;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    setTimeout(() => {
      o.stop();
      void ctx.close();
    }, 220);
  } catch {
    /* ignore */
  }
}

/**
 * Polls for new open volunteer rides. Alerts with toast + optional browser
 * notification + short beep so founders don't miss requests when the app is open.
 */
export function FounderRideAlerts({ enabled = true }: { enabled?: boolean }) {
  const primed = useRef(false);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    // Ask once for browser notifications (user can deny)
    try {
      if ("Notification" in window && Notification.permission === "default") {
        void Notification.requestPermission();
      }
    } catch {
      /* ignore */
    }

    let cancelled = false;

    async function tick() {
      try {
        const res = await listVolunteerRidesFn();
        if (cancelled) return;
        const open = res.rides.filter(
          (r) =>
            r.status === "seeking_volunteer" || r.status === "escalated_paid",
        );
        const seen = loadSeen();

        if (!primed.current) {
          // First load: remember current open IDs without alarming
          for (const r of open) seen.add(r.id);
          saveSeen(seen);
          primed.current = true;
          return;
        }

        const fresh = open.filter((r) => !seen.has(r.id));
        if (fresh.length === 0) return;

        for (const r of fresh) {
          seen.add(r.id);
          const title = `New Share ride: ${r.fullName}`;
          const body = `${r.pickup} → ${r.dropoff} · ${r.when} · ${r.phone}`;
          toast.error(title, {
            description: body,
            duration: 20_000,
            action: {
              label: "Open",
              onClick: () => {
                window.location.href = "/volunteer";
              },
            },
          });
          try {
            if (
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              new Notification(title, { body, tag: r.id });
            }
          } catch {
            /* ignore */
          }
          beep();
        }
        saveSeen(seen);
      } catch {
        /* offline */
      }
    }

    void tick();
    const id = window.setInterval(() => void tick(), 12_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [enabled]);

  return null;
}
