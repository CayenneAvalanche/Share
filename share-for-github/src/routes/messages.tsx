import { useEffect } from "react";
import { createFileRoute, Link, Outlet, useChildMatches } from "@tanstack/react-router";
import { MessageCircle, Shield } from "lucide-react";
import { AppShell } from "@/components/share/shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useShareStore } from "@/lib/share/store";
import { sortThreads, threadPreview } from "@/lib/share/messages";
import { formatTime } from "@/lib/utils";
import { listChatFn } from "@/lib/share/server-fns";
import { useCurrentUser } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/messages")({
  component: MessagesLayout,
});

function MessagesLayout() {
  const childMatches = useChildMatches();
  if (childMatches.length > 0) return <Outlet />;
  return <MessagesPage />;
}

function MessagesPage() {
  const threads = useShareStore((s) => s.threads);
  const messages = useShareStore((s) => s.messages);
  const mergeCloudChat = useShareStore((s) => s.mergeCloudChat);
  const riderName = useShareStore((s) => s.riderName);
  const user = useCurrentUser();
  const sorted = sortThreads(threads);

  useEffect(() => {
    let cancelled = false;
    async function pull() {
      let phone = "";
      try {
        phone = localStorage.getItem("share-vol-guest-phone") || "";
      } catch {
        /* ignore */
      }
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
    const t = window.setInterval(pull, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [user?.primaryEmail, user?.displayName, riderName, mergeCloudChat]);

  return (
    <AppShell
      title="Messages"
      subtitle="Synced across your devices · logged for safety"
      solidHeader
    >
      <Card className="mt-3 border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5">
        <CardContent className="flex gap-3 p-3 text-sm text-[var(--color-fg-muted)]">
          <Shield className="mt-0.5 size-4 shrink-0 text-[var(--color-primary)]" />
          <p>
            Keep trip talk here — not only SMS. Messages sync when you're
            signed in (or when the ride phone matches). Unread shows a badge on
            Chat.
          </p>
        </CardContent>
      </Card>

      <div className="mt-4 flex flex-col gap-2 pb-6">
        {sorted.length === 0 ? (
          <div className="py-16 text-center">
            <MessageCircle className="mx-auto size-8 text-[var(--color-fg-subtle)]" />
            <p className="mt-3 font-semibold">No conversations yet</p>
            <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
              Book a ride or accept a volunteer trip and chat opens here on every
              device.
            </p>
          </div>
        ) : (
          sorted.map((th) => (
            <Link key={th.id} to="/messages/$id" params={{ id: th.id }}>
              <Card className="transition-shadow hover:shadow-[var(--shadow-md)]">
                <CardContent className="flex gap-3 p-4">
                  <div className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/12 font-semibold text-[var(--color-primary)]">
                    {th.participants
                      .find((p) => p !== "You")
                      ?.charAt(0)
                      ?.toUpperCase() ?? "S"}
                    {th.unread > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-[var(--color-accent)] text-[9px] font-bold text-white">
                        {th.unread > 9 ? "9+" : th.unread}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={
                          th.unread > 0
                            ? "truncate font-bold text-[var(--color-fg)]"
                            : "truncate font-semibold"
                        }
                      >
                        {th.subject}
                      </p>
                      <span className="shrink-0 text-[10px] text-[var(--color-fg-subtle)]">
                        {formatTime(th.updatedAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-[var(--color-fg-muted)]">
                      {threadPreview(messages, th.id)}
                    </p>
                    <div className="mt-1 flex gap-1">
                      <Badge variant="outline" className="capitalize text-[10px]">
                        {th.relatedType}
                      </Badge>
                      {th.unread > 0 && (
                        <Badge variant="accent">{th.unread} new</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </AppShell>
  );
}
