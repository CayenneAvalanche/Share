import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useShareStore } from "@/lib/share/store";
import { ShareMark } from "@/components/share/logo";

const STORAGE_KEY = "share-demo-notice-v1";

/**
 * First-visit pilot banner: demo-only + waitlist.
 * Dismissed once per browser (localStorage).
 */
export function DemoNoticeModal({ force = false }: { force?: boolean }) {
  const joinWaitlist = useShareStore((s) => s.joinWaitlist);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (force) {
      setOpen(true);
      return;
    }
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, [force]);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  function onWaitlist(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }
    joinWaitlist(email);
    toast.success("You're on the waitlist");
    setEmail("");
    dismiss();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-notice-title"
    >
      <div className="w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-lg)]">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-[var(--radius-lg)] bg-[#2a6b45] p-2">
            <ShareMark inverted className="size-8" />
          </div>
          <div>
            <p
              id="demo-notice-title"
              className="font-display text-lg font-semibold"
            >
              Pilot demo
            </p>
            <p className="text-xs text-[var(--color-fg-muted)]">
              share.myendeavors.me
            </p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-[var(--color-fg-muted)]">
          This is a <strong className="text-[var(--color-fg)]">working demo</strong> of
          Share for early access and interviews. Data is sample/local, payments are
          demo-only, and rides are not live insurance-backed marketplace trips yet.
          Explore freely — or join the waitlist to be first when we open seats in
          Hub City.
        </p>
        <form onSubmit={onWaitlist} className="mt-4 flex flex-col gap-2">
          <Input
            type="email"
            required
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Waitlist email"
          />
          <Button type="submit" className="w-full">
            Join waitlist
          </Button>
        </form>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Button variant="secondary" className="flex-1" asChild>
            <Link to="/apply/driver" onClick={dismiss}>
              Apply as driver
            </Link>
          </Button>
          <Button variant="outline" className="flex-1" onClick={dismiss}>
            Just explore the demo
          </Button>
        </div>
      </div>
    </div>
  );
}
