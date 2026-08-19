import { AIChatBox, type Message } from "@/components/AIChatBox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPreviewAuthHeaders } from "@/lib/previewAuth";
import { trpc } from "@/lib/trpc";
import {
  Loader2,
  MessageSquarePlus,
  MessagesSquare,
  PanelLeftClose,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function Chat() {
  const utils = trpc.useUtils();
  const conversations = trpc.ai.chat.conversations.useQuery();
  const create = trpc.ai.chat.createConversation.useMutation({
    onSuccess: value => {
      setSelectedId(value.id);
      utils.ai.chat.conversations.invalidate();
    },
  });
  const [selectedId, setSelectedId] = useState<number>();
  const messages = trpc.ai.chat.messages.useQuery(
    { conversationId: selectedId ?? 0 },
    { enabled: Boolean(selectedId) }
  );
  const [draft, setDraft] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const selected = conversations.data?.find(item => item.id === selectedId);

  useEffect(() => {
    if (!selectedId && conversations.data?.[0])
      setSelectedId(conversations.data[0].id);
  }, [conversations.data, selectedId]);
  useEffect(() => {
    setDraft([]);
  }, [selectedId]);
  const renderedMessages = useMemo<Message[]>(
    () => [
      ...(messages.data ?? []).map(item => ({
        role: item.role,
        content: item.content,
      })),
      ...draft,
    ],
    [messages.data, draft]
  );

  async function startConversation() {
    const title = newTitle.trim() || "New conversation";
    setNewTitle("");
    await create.mutateAsync({ title });
  }

  async function send(content: string) {
    if (!selectedId || isStreaming) return;
    setIsStreaming(true);
    setDraft([
      { role: "user", content },
      { role: "assistant", content: "" },
    ]);
    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...getPreviewAuthHeaders(),
        },
        body: JSON.stringify({ conversationId: selectedId, content }),
      });
      if (!response.ok || !response.body)
        throw new Error("The chat response could not be started.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const event of events) {
          const raw = event
            .split("\n")
            .find(line => line.startsWith("data: "))
            ?.slice(6);
          if (!raw) continue;
          const parsed = JSON.parse(raw) as { delta?: string; error?: string };
          if (parsed.error) throw new Error(parsed.error);
          if (parsed.delta)
            setDraft(current => [
              { role: "user", content },
              {
                role: "assistant",
                content: `${current[1]?.content ?? ""}${parsed.delta}`,
              },
            ]);
        }
      }
      await Promise.all([
        utils.ai.chat.messages.invalidate({ conversationId: selectedId }),
        utils.ai.chat.conversations.invalidate(),
        utils.workspace.summary.invalidate(),
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chat failed");
    } finally {
      setDraft([]);
      setIsStreaming(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-3.5rem)] max-w-7xl gap-4 px-1 py-2 sm:px-4">
      <aside className="hidden w-64 shrink-0 flex-col rounded-2xl border border-white/10 bg-[#101226] p-3 md:flex">
        <div className="flex items-center gap-2 px-2 py-2">
          <MessagesSquare className="size-4 text-violet-300" />
          <span className="text-sm font-semibold text-white">
            Conversations
          </span>
        </div>
        <div className="mt-3 flex gap-2">
          <Input
            value={newTitle}
            onChange={event => setNewTitle(event.target.value)}
            onKeyDown={event => event.key === "Enter" && startConversation()}
            placeholder="Conversation title"
            className="border-white/10 bg-white/5 text-white placeholder:text-slate-500"
          />
          <Button
            size="icon"
            onClick={startConversation}
            disabled={create.isPending}
            className="shrink-0 bg-violet-500 hover:bg-violet-400"
          >
            <MessageSquarePlus className="size-4" />
          </Button>
        </div>
        <div className="mt-4 space-y-1 overflow-y-auto">
          {conversations.data?.map(item => (
            <button
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition ${selectedId === item.id ? "bg-violet-400/15 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}
            >
              <span className="block truncate">{item.title}</span>
              <span className="mt-1 block text-[11px] text-slate-500">
                {new Date(item.updatedAt).toLocaleDateString()}
              </span>
            </button>
          ))}
        </div>
      </aside>
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#101226]">
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.17em] text-violet-300">
              AI Chat
            </p>
            <h1 className="mt-1 text-base font-semibold text-white">
              {selected?.title ?? "Start a private conversation"}
            </h1>
          </div>
          {messages.isLoading && (
            <Loader2 className="size-4 animate-spin text-slate-500" />
          )}
        </header>
        {selectedId ? (
          <AIChatBox
            className="h-full rounded-none border-0 bg-transparent shadow-none"
            height="100%"
            messages={renderedMessages}
            onSendMessage={send}
            isLoading={isStreaming}
            placeholder="Ask anything…"
            emptyStateMessage="Your private assistant is ready."
            suggestedPrompts={[
              "Summarize a complex idea",
              "Help me plan a project",
              "Explain this code",
            ]}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
            <PanelLeftClose className="size-8 text-slate-600" />
            <p className="max-w-sm text-sm leading-6 text-slate-400">
              Create a conversation from the sidebar to start a private,
              persisted AI chat.
            </p>
            <Button
              onClick={() => create.mutate({ title: "New conversation" })}
              className="bg-violet-500 hover:bg-violet-400"
            >
              New conversation
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
