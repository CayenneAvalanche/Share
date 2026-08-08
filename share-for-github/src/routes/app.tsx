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
import { Card, CardContent } from "@/components/ui/card";
import { useShareStore } from "@/lib/share/store";

export const Route = createFileRoute("/app")({
  component: AppHomePage,
});

function AppHomePage() {
  const unread = useShareStore((s) =>
    s.threads.reduce((n, t) => n + t.unread, 0),
  );

  return (
    <AppShell>
      <section className="-mx-4 overflow-hidden bg-[var(--color-bg-inverse)] px-4 pb-8 pt-7 text-[var(--color-fg-inverse)] safe-pt">
        <div className="mx-auto flex max-w-lg flex-col items-center text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-[#2a6b45] shadow-[var(--shadow-md)]">
            <ShareMark inverted className="size-9" />
          </div>
          <h1 className="font-display text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
            Share your life.
            <br />
            Share your adventures.
          </h1>
        </div>
      </section>

      <section className="relative z-10 -mt-4">
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

            <Link
              to="/volunteer"
              className="mt-3 flex w-full items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/8 px-4 py-5 text-center transition-all active:scale-[0.99]"
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
      className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-5 text-center transition-all hover:border-[var(--color-primary)]/40 active:scale-[0.98]"
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
      className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-3.5 transition-colors hover:bg-[var(--color-bg-subtle)] active:scale-[0.99]"
    >
      <div className="flex size-9 items-center justify-center rounded-full bg-[var(--color-bg-subtle)] text-[var(--color-primary)]">
        <Icon className="size-4" />
      </div>
      <span className="flex-1 text-sm font-semibold">{title}</span>
      <ArrowRight className="size-4 text-[var(--color-fg-subtle)]" />
    </Link>
  );
}
