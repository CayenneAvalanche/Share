import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Send, Shield } from "lucide-react";
import { AppShell } from "@/components/share/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useShareStore } from "@/lib/share/store";
import { messagesForThread, enrichThreadsWithRiderNames } from "@/lib/share/messages";
import { formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { listChatFn, markChatReadFn } from "@/lib/share/server-fns";

export const Route = createFileRoute("/messages/$id")({
  component: ThreadPage,
});

function ThreadPage() {
  const { id } = Route.useParams();
  const threads = useShareStore((s) => s.threads);
  const messages = useShareStore((s) => s.messages);
  const volunteerRides = useShareStore((s) => s.volunteerRides);
  const riderApps = useShareStore((s) => s.riderApps);
  const sendMessage = useShareStore((s) => s.sendMessage);
  const openThread = useShareStore((s) => s.openThread);
  const mergeCloudChat = useShareStore((s) => s.mergeCloudChat);
  const riderName = useShareStore((s) => s.riderName);
  const user = useCurrentUser();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastSendRef = useRef<{ body: string; at: number } | null>(null);

  const thread = enrichThreadsWithRiderNames(
    threads,
    volunteerRides,
    riderApps,
  ).find((t) => t.id === id);
  const msgs = messagesForThread(messages, id);

  useEffect(() => {
    openThread(id);
    void markChatReadFn({
      data: {
        threadId: id,
        email: user?.primaryEmail || undefined,
        phone: (() => {
          try {
            return localStorage.getItem("share-vol-guest-phone") || undefined;
          } catch {
            return undefined;
          }
        })(),
      },
    }).catch(() => {});
  }, [id, openThread, user?.primaryEmail]);

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
    const t = window.setInterval(pull, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [user?.primaryEmail, user?.displayName, riderName, mergeCloudChat]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length]);

  if (!thread) {
    return (
      <AppShell title="Chat" backTo="/messages" solidHeader>
        <p className="py-12 text-center text-[var(--color-fg-muted)]">
          Thread not found — pull to refresh Chat, or open the trip and tap
          Message again.
        </p>
        <Button asChild className="mx-auto block w-fit">
          <Link to="/messages">Back</Link>
        </Button>
      </AppShell>
    );
  }

  function onSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    const body = text.trim();
    // Guard double-tap / double submit
    const now = Date.now();
    if (
      lastSendRef.current &&
      lastSendRef.current.body === body &&
      now - lastSendRef.current.at < 2500
    ) {
      return;
    }
    lastSendRef.current = { body, at: now };
    const fromName = user?.displayName || riderName || "You";
    const fromEmail = user?.primaryEmail || undefined;
    setText("");
    setSending(true);
    // Single path: local store + one cloud write (with stable messageId)
    sendMessage(id, body, fromName, fromEmail);
    void markChatReadFn({
      data: { threadId: id, email: fromEmail },
    })
      .catch(() => {})
      .finally(() => {
        window.setTimeout(() => setSending(false), 400);
      });
  }

  return (
    <AppShell
      title={thread.subject}
      subtitle={thread.participants.join(" · ")}
      backTo="/messages"
      solidHeader
      hideNav
    >
      <div className="flex min-h-[calc(100dvh-8rem)] flex-col pb-4">
        <p className="mb-3 flex items-center gap-1.5 text-xs text-[var(--color-fg-subtle)]">
          <Shield className="size-3.5 text-[var(--color-primary)]" />
          Logged for safety · prefer this over off-app DMs
        </p>

        <div className="flex-1 space-y-3">
          {msgs.map((m) => {
            const mine =
              m.from === "You" ||
              m.from === riderName ||
              m.from === user?.displayName ||
              (!!user?.primaryEmail &&
                !!m.fromEmail &&
                m.fromEmail.toLowerCase() === user.primaryEmail.toLowerCase());
            const system = m.kind === "system";
            if (system) {
              return (
                <p
                  key={m.id}
                  className="mx-auto max-w-[90%] rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] px-3 py-2 text-center text-xs text-[var(--color-fg-muted)]"
                >
                  {m.body}
                </p>
              );
            }
            return (
              <div
                key={m.id}
                className={cn("flex", mine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-[var(--radius-lg)] px-3.5 py-2.5 text-sm shadow-[var(--shadow-sm)]",
                    mine
                      ? "bg-[var(--color-primary)] text-[var(--color-primary-fg)]"
                      : "border border-[var(--color-border)] bg-[var(--color-bg-elevated)]",
                  )}
                >
                  {!mine && (
                    <p className="mb-0.5 text-[10px] font-semibold opacity-70">
                      {m.from}
                    </p>
                  )}
                  <p className="leading-snug">{m.body}</p>
                  <p
                    className={cn(
                      "mt-1 text-[10px]",
                      mine ? "opacity-70" : "text-[var(--color-fg-subtle)]",
                    )}
                  >
                    {formatTime(m.at)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={onSend}
          className="sticky bottom-0 mt-4 flex gap-2 border-t border-[var(--color-border)] bg-[var(--color-bg)] pt-3"
        >
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message…"
            className="flex-1"
            autoComplete="off"
            disabled={sending}
          />
          <Button
            type="submit"
            size="icon"
            aria-label="Send"
            disabled={sending || !text.trim()}
          >
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
