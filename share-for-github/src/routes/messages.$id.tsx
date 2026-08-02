import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Send, Shield } from "lucide-react";
import { AppShell } from "@/components/share/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useShareStore } from "@/lib/share/store";
import { messagesForThread } from "@/lib/share/messages";
import { formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/messages/$id")({
  component: ThreadPage,
});

function ThreadPage() {
  const { id } = Route.useParams();
  const threads = useShareStore((s) => s.threads);
  const messages = useShareStore((s) => s.messages);
  const sendMessage = useShareStore((s) => s.sendMessage);
  const openThread = useShareStore((s) => s.openThread);
  const riderName = useShareStore((s) => s.riderName);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const thread = threads.find((t) => t.id === id);
  const msgs = messagesForThread(messages, id);

  useEffect(() => {
    openThread(id);
  }, [id, openThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length]);

  if (!thread) {
    return (
      <AppShell title="Chat" backTo="/messages" solidHeader>
        <p className="py-12 text-center text-[var(--color-fg-muted)]">
          Thread not found.
        </p>
        <Button asChild className="mx-auto block w-fit">
          <Link to="/messages">Back</Link>
        </Button>
      </AppShell>
    );
  }

  function onSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage(id, text, riderName || "You");
    setText("");
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
              m.from === (riderName || "You");
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
          />
          <Button type="submit" size="icon" aria-label="Send">
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
