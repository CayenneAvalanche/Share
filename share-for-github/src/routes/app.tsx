import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Car,
  Package,
  Boxes,
  ArrowRight,
  HeartHandshake,
  MessageCircle,
  KeyRound,
  UserPlus,
} from "lucide-react";
import { AppShell } from "@/components/share/shell";
import { ShareMark } from "@/components/share/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useShareStore } from "@/lib/share/store";
import { isDemoMode } from "@/lib/share/mode";
import { SHARE_BUILD } from "@/lib/share/contact";

export const Route = createFileRoute("/app")({
  component: AppHomePage,
});

function AppHomePage() {
  const unread = useShareStore((s) =>
    s.threads.reduce((n, t) => n + t.unread, 0),
  );
  const demo = isDemoMode();

  return (
    <AppShell>
      <section className="animate-share-rise -mx-4 overflow-hidden bg-[var(--color-bg-inverse)] px-4 pb-7 pt-6 text-[var(--color-fg-inverse)] safe-pt">
        <div className="relative mx-auto max-w-lg">
          <div className="relative flex flex-col items-center text-center">
            <div className="mb-3 flex items-center gap-3 rounded-[var(--radius-xl)] bg-[#2a6b45] px-5 py-4 shadow-[var(--shadow-md)]">
              <ShareMark inverted className="size-12" />
            </div>
            <p className="font-display text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
              Share your life.
              <br />
              Share your adventures.
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-inverse)]/55">
              {demo ? "Demo · sample data" : "Beta · Lafayette"}
            </p>
          </div>
        </div>
      </section>

      <section className="animate-share-rise animate-share-rise-delay-1 relative z-10 -mt-4">
        <Card className="shadow-[var(--shadow-md)]">
          <CardContent className="p-5">
            <h2 className="font-display text-xl font-semibold">
              What would you like to Share?
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Choice to="/rides" icon={Car} title="Ride" />
              <Choice to="/deliveries" icon={Package} title="Delivery" />
              <Choice to="/cars" icon={KeyRound} title="Car" />
              <Choice to="/share-stuff" icon={Boxes} title="Lagniappe" />
            </div>

            {/* 5th tile — volunteer, full width */}
            <Link
              to="/volunteer"
              className="mt-3 flex w-full items-center justify-center gap-3 rounded-[var(--radius-lg)] border-2 border-[var(--color-primary)]/40 bg-gradient-to-r from-[var(--color-primary)]/12 to-[var(--color-primary)]/5 px-4 py-5 text-center transition-all active:scale-[0.99]"
            >
              <div className="flex size-11 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-fg)]">
                <HeartHandshake className="size-5" />
              </div>
              <span className="text-base font-semibold">Volunteer</span>
            </Link>

            <div className="mt-4 flex flex-col gap-2">
              <ChoiceRow to="/apply" icon={UserPlus} title="Apply" />
              <ChoiceRow
                to="/messages"
                icon={MessageCircle}
                title={unread ? `Messages (${unread})` : "Messages"}
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {demo && (
        <p className="mt-8 pb-4 text-center text-xs text-[var(--color-fg-subtle)]">
          <Link to="/demo" className="underline">
            Demo checklist
          </Link>
          {" · "}
          <Link to="/" className="underline">
            Landing page
          </Link>
        </p>
      )}
      <p className="mt-8 pb-4 text-center text-xs text-[var(--color-fg-subtle)]">
        <Link to="/" className="underline">
          Landing
        </Link>
        {" · "}
        build {SHARE_BUILD}
        {demo ? " · demo" : " · beta"}
      </p>
    </AppShell>
  );
}

function Choice({
  to,
  icon: Icon,
  title,
}: {
  to: string;
  icon: typeof Car;
  title: string;
}) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border-2 border-[var(--color-primary)]/35 bg-[var(--color-primary)]/6 px-3 py-5 text-center transition-all active:scale-[0.98]"
    >
      <div className="flex size-11 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-fg)]">
        <Icon className="size-5" />
      </div>
      <span className="text-sm font-semibold">{title}</span>
    </Link>
  );
}

function ChoiceRow({
  to,
  icon: Icon,
  title,
}: {
  to: string;
  icon: typeof Car;
  title: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-3 transition-all active:scale-[0.99]"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)]">
        <Icon className="size-4" />
      </div>
      <p className="flex-1 text-sm font-semibold">{title}</p>
      <ArrowRight className="size-4 shrink-0 text-[var(--color-fg-subtle)]" />
    </Link>
  );
}
