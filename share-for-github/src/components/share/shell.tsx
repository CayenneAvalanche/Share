import { useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Car,
  Package,
  User,
  ArrowLeft,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ShareMark, ShareWordmark } from "./logo";
import { Button } from "@/components/ui/button";
import { useShareStore } from "@/lib/share/store";
import { SHARE_BUILD } from "@/lib/share/contact";
import { FounderRideAlerts } from "./founder-ride-alerts";
import { listChatFn } from "@/lib/share/server-fns";
import { useCurrentUser } from "@/lib/auth/use-current-user";


type NavItem = {
  to: string;
  label: string;
  icon: typeof Home;
  match?: (path: string) => boolean;
  badge?: number;
};

/** Landing / marketing pages (no bottom app nav) */
export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[var(--color-bg)] text-[var(--color-fg)]">
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-bg)]/90 backdrop-blur-md safe-pt">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="shrink-0 rounded-[var(--radius-md)] outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]" aria-label="Share home">
            <ShareWordmark />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="sm" className="hidden md:inline-flex" asChild>
              <Link to="/rideshare">Rides</Link>
            </Button>
            <Button variant="ghost" size="sm" className="hidden md:inline-flex" asChild>
              <Link to="/delivery">Delivery</Link>
            </Button>
            <Button variant="ghost" size="sm" className="hidden lg:inline-flex" asChild>
              <Link to="/car-rental">Cars</Link>
            </Button>
            <Button variant="ghost" size="sm" className="hidden lg:inline-flex" asChild>
              <Link to="/lagniappe">Lagniappe</Link>
            </Button>
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
              <Link to="/locations">Cities</Link>
            </Button>
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
              <Link to="/apply">Apply</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/app">Open app</Link>
            </Button>
          </div>
        </div>
      </header>
      {children}
      <p className="px-4 pb-6 pt-2 text-center text-[10px] text-[var(--color-fg-subtle)]">
        Share · {SHARE_BUILD}
      </p>
    </div>
  );
}

export function AppShell({
  children,
  title,
  subtitle,
  backTo,
  hideNav = false,
  action,
  solidHeader = false,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  backTo?: string;
  hideNav?: boolean;
  action?: React.ReactNode;
  solidHeader?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const unread = useShareStore((s) =>
    s.threads.reduce((n, t) => n + t.unread, 0),
  );
  const mergeCloudChat = useShareStore((s) => s.mergeCloudChat);
  const riderName = useShareStore((s) => s.riderName);
  const user = useCurrentUser();

  // Keep Chat badge live across devices
  useEffect(() => {
    let cancelled = false;
    async function pull() {
      let phone = "";
      try {
        phone = localStorage.getItem("share-vol-guest-phone") || "";
      } catch {
        /* ignore */
      }
      if (!user?.primaryEmail && !phone) return;
      try {
        let pin = "";
        try {
          pin = sessionStorage.getItem("share-admin-pin") || "";
        } catch {
          /* ignore */
        }
        const res = await listChatFn({
          data: {
            email: user?.primaryEmail || undefined,
            phone: phone || undefined,
            name: user?.displayName || riderName || undefined,
            pin: pin || undefined,
          },
        });
        if (cancelled) return;
        mergeCloudChat({ threads: res.threads, messages: res.messages });
      } catch {
        /* offline */
      }
    }
    pull();
    const t = window.setInterval(pull, 8000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [user?.primaryEmail, user?.displayName, riderName, mergeCloudChat]);

  const NAV: NavItem[] = [
    {
      to: "/app",
      label: "Home",
      icon: Home,
      match: (p) => p === "/app" || p === "/about" || p.startsWith("/volunteer"),
    },
    {
      to: "/rides",
      label: "Rides",
      icon: Car,
      match: (p) => p.startsWith("/rides") || p.startsWith("/local"),
    },
    {
      to: "/messages",
      label: "Chat",
      icon: MessageCircle,
      match: (p) => p.startsWith("/messages"),
      badge: unread,
    },
    {
      to: "/deliveries",
      label: "Deliver",
      icon: Package,
      match: (p) => p.startsWith("/deliveries") || p.startsWith("/track"),
    },
    {
      to: "/profile",
      label: "You",
      icon: User,
      match: (p) =>
        p.startsWith("/profile") ||
        p.startsWith("/apply") ||
        p.startsWith("/earnings") ||
        p.startsWith("/checkout") ||
        p.startsWith("/trips"),
    },
  ];

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-[var(--color-bg)]">
      <FounderRideAlerts />
      {(title || solidHeader) && (
        <header
          className={cn(
            "sticky top-0 z-30 safe-pt",
            solidHeader
              ? "border-b border-[var(--color-border)] bg-[var(--color-bg)]/95 backdrop-blur-md"
              : "bg-transparent",
          )}
        >
          <div className="grid grid-cols-[minmax(2.75rem,auto)_1fr_minmax(2.75rem,auto)] items-center gap-2 px-3 py-3 sm:px-4">
            {/* Left: back OR logo → home (instinctive brand tap) */}
            <div className="flex min-w-0 items-center justify-start">
              {backTo ? (
                <Button variant="ghost" size="icon" asChild className="-ml-1">
                  <Link to={backTo} aria-label="Back">
                    <ArrowLeft className="size-5" />
                  </Link>
                </Button>
              ) : (
                <Link
                  to="/app"
                  aria-label="Share home"
                  className="flex min-h-10 min-w-10 items-center gap-1.5 rounded-[var(--radius-md)] pr-1 outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] active:opacity-80"
                >
                  <ShareMark className="size-8 shrink-0" />
                  <span className="font-display text-lg font-semibold tracking-tight">
                    Share
                  </span>
                </Link>
              )}
            </div>

            {/* Center: page title */}
            <div className="min-w-0 text-center">
              {title && (
                <h1 className="truncate font-display text-base font-semibold sm:text-lg">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="truncate text-[11px] text-[var(--color-fg-muted)] sm:text-xs">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Right: action (or spacer so title stays centered) */}
            <div className="flex min-w-0 items-center justify-end">
              {action ?? <span className="size-10 shrink-0" aria-hidden />}
            </div>
          </div>
        </header>
      )}

      <main className={cn("flex-1 px-4", hideNav ? "pb-8" : "pb-24")}>
        {children}
        <p className="pb-2 pt-6 text-center text-[10px] text-[var(--color-fg-subtle)]">
          Share · {SHARE_BUILD}
        </p>
      </main>

      {!hideNav && (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)]/95 backdrop-blur-md safe-pb">
          <div className="mx-auto flex max-w-lg items-stretch justify-around gap-0.5 overflow-x-auto px-0.5 pt-1">
            {NAV.map((item) => {
              const active = item.match
                ? item.match(pathname)
                : pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "relative flex min-h-14 min-w-[3.4rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-[var(--radius-md)] px-1 text-[10px] font-medium transition-colors sm:min-w-[4rem] sm:text-[11px]",
                    active
                      ? "text-[var(--color-primary)]"
                      : "text-[var(--color-fg-subtle)] hover:text-[var(--color-fg)]",
                  )}
                >
                  <Icon
                    className={cn("size-5", active && "stroke-[2.25]")}
                  />
                  {item.label}
                  {item.badge ? (
                    <span className="absolute right-1/2 top-1 translate-x-3.5 flex size-4 items-center justify-center rounded-full bg-[var(--color-accent)] text-[9px] font-bold text-white">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
