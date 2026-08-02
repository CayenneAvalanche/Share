import type { ChatMessage, ChatThread } from "./data";

export function sortThreads(threads: ChatThread[]) {
  return [...threads].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function messagesForThread(all: ChatMessage[], threadId: string) {
  return all
    .filter((m) => m.threadId === threadId)
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

export function threadPreview(all: ChatMessage[], threadId: string) {
  const msgs = messagesForThread(all, threadId);
  return msgs[msgs.length - 1]?.body ?? "No messages yet";
}
