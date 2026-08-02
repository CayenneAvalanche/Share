import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, Shield } from "lucide-react";
import { AppShell } from "@/components/share/shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useShareStore } from "@/lib/share/store";
import { sortThreads, threadPreview } from "@/lib/share/messages";
import { formatTime } from "@/lib/utils";

export const Route = createFileRoute("/messages")({
  component: MessagesPage,
});

function MessagesPage() {
  const threads = useShareStore((s) => s.threads);
  const messages = useShareStore((s) => s.messages);
  const sorted = sortThreads(threads);

  return (
    <AppShell
      title="Messages"
      subtitle="In-app only · logged for safety"
      solidHeader
    >
      <Card className="mt-3 border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5">
        <CardContent className="flex gap-3 p-3 text-sm text-[var(--color-fg-muted)]">
          <Shield className="mt-0.5 size-4 shrink-0 text-[var(--color-primary)]" />
          <p>
            Keep trip talk here — not only SMS. If something goes wrong, Share
            can review this thread. Dashcam + chat = better safety story.
          </p>
        </CardContent>
      </Card>

      <div className="mt-4 flex flex-col gap-2 pb-6">
        {sorted.length === 0 ? (
          <div className="py-16 text-center">
            <MessageCircle className="mx-auto size-8 text-[var(--color-fg-subtle)]" />
            <p className="mt-3 font-semibold">No conversations yet</p>
            <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
              Book a ride or delivery and chat will open here.
            </p>
          </div>
        ) : (
          sorted.map((t) => (
            <Link key={t.id} to="/messages/$id" params={{ id: t.id }}>
              <Card className="transition-shadow hover:shadow-[var(--shadow-md)]">
                <CardContent className="flex gap-3 p-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/12 font-semibold text-[var(--color-primary)]">
                    {t.participants
                      .find((p) => p !== "You")
                      ?.charAt(0)
                      ?.toUpperCase() ?? "S"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-semibold">{t.subject}</p>
                      <span className="shrink-0 text-[10px] text-[var(--color-fg-subtle)]">
                        {formatTime(t.updatedAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-[var(--color-fg-muted)]">
                      {threadPreview(messages, t.id)}
                    </p>
                    <div className="mt-1 flex gap-1">
                      <Badge variant="outline" className="capitalize text-[10px]">
                        {t.relatedType}
                      </Badge>
                      {t.unread > 0 && (
                        <Badge variant="accent">{t.unread} new</Badge>
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
