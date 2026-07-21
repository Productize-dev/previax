"use client";

import {
  Bot,
  Loader2,
  Send,
  Sparkles,
  ClipboardPaste,
  Building2,
  Home,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { AiPasteModal } from "@/components/dashboard/ai-paste-modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import type {
  AssistantMessage,
  AssistantResponse,
} from "@/lib/ai/assistant";
import type { ExtractedListingDraft } from "@/lib/ai/listing-extract";
import { cn } from "@/lib/utils";

type AdminAssistantProps = {
  onApplyDraft: (draft: ExtractedListingDraft, focus: "community" | "model") => void;
  onOpenCommunities: () => void;
};

type ChatItem = AssistantMessage & {
  draft?: ExtractedListingDraft;
  suggestedActions?: AssistantResponse["suggestedActions"];
};

const QUICK_PROMPTS = [
  "How should I add a new Lennar community?",
  "What fields are required for a model home?",
  "Help me organize communities by city",
];

export function AdminAssistant({
  onApplyDraft,
  onOpenCommunities,
}: AdminAssistantProps) {
  const { communities, builders } = useDashboardData();
  const [messages, setMessages] = useState<ChatItem[]>([
    {
      role: "assistant",
      content:
        "I'm your Previax admin assistant. Paste a brochure or listing URL, ask how to manage the catalog, or say “extract this listing”.",
      suggestedActions: ["paste_listing", "open_communities"],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [latestDraft, setLatestDraft] = useState<ExtractedListingDraft | null>(
    null,
  );
  const bottomRef = useRef<HTMLDivElement>(null);

  const catalog = useMemo(
    () => ({
      communityCount: communities.length,
      builderNames: builders.map((b) => b.name),
      sampleCommunities: communities.slice(0, 12).map((c) => ({
        name: c.name,
        city: c.city,
        models: c.homes.length,
      })),
    }),
    [communities, builders],
  );

  async function sendMessage(raw: string) {
    const message = raw.trim();
    if (!message || loading) return;

    const history = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map(({ role, content }) => ({ role, content }));

    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history, catalog }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(err?.error ?? "Assistant request failed");
      }
      const data = (await res.json()) as AssistantResponse;
      if (data.draft) setLatestDraft(data.draft);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          draft: data.draft,
          suggestedActions: data.suggestedActions,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            err instanceof Error
              ? err.message
              : "Something went wrong talking to the assistant.",
          suggestedActions: ["paste_listing"],
        },
      ]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() =>
        bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
      );
    }
  }

  function handleExtracted(draft: ExtractedListingDraft) {
    setLatestDraft(draft);
    const homeCount = draft.homes?.length ?? 0;
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `Draft ready for ${draft.community?.name ?? "community"}${
          homeCount
            ? ` · ${homeCount} model${homeCount === 1 ? "" : "s"}`
            : ""
        }. Apply it to the forms when you're ready.`,
        draft,
        suggestedActions: [
          "apply_community",
          ...(homeCount > 0 ? (["apply_model"] as const) : []),
          "open_communities",
        ],
      },
    ]);
  }

  function runAction(
    action: NonNullable<AssistantResponse["suggestedActions"]>[number],
    draft?: ExtractedListingDraft,
  ) {
    const activeDraft = draft ?? latestDraft;
    if (action === "paste_listing") {
      setPasteOpen(true);
      return;
    }
    if (action === "open_communities") {
      onOpenCommunities();
      return;
    }
    if (!activeDraft) {
      setPasteOpen(true);
      return;
    }
    if (action === "apply_community") {
      onApplyDraft(activeDraft, "community");
      return;
    }
    if (action === "apply_model") {
      onApplyDraft(activeDraft, "model");
    }
  }

  return (
    <div className="flex h-[min(72vh,720px)] flex-col overflow-hidden rounded-xl border border-border bg-card">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Bot className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-lg">Admin Assistant</h2>
          <p className="text-xs text-muted-foreground">
            Catalog help · paste & extract · draft communities & models
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setPasteOpen(true)}
        >
          <ClipboardPaste className="mr-1.5 size-3.5" />
          Paste listing
        </Button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.map((msg, index) => (
          <div
            key={`${msg.role}-${index}`}
            className={cn(
              "flex",
              msg.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground",
              )}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.role === "assistant" && msg.suggestedActions && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {msg.suggestedActions.map((action) => (
                    <ActionChip
                      key={action}
                      action={action}
                      onClick={() => runAction(action, msg.draft)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="space-y-2 border-t border-border px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={loading}
              onClick={() => void sendMessage(prompt)}
              className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={2}
            placeholder="Ask anything, or paste listing text…"
            className="min-h-[64px] resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendMessage(input);
              }
            }}
          />
          <Button
            type="button"
            className="self-end"
            disabled={loading || !input.trim()}
            onClick={() => void sendMessage(input)}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
        {latestDraft && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs">
            <Sparkles className="size-3.5 text-primary" />
            <span className="text-muted-foreground">
              Draft ready: {latestDraft.community?.name ?? "Untitled"}
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7"
              onClick={() => onApplyDraft(latestDraft, "community")}
            >
              <Building2 className="mr-1 size-3" />
              Apply community
            </Button>
            {(latestDraft.homes?.length ?? 0) > 0 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7"
                onClick={() => onApplyDraft(latestDraft, "model")}
              >
                <Home className="mr-1 size-3" />
                Apply model
              </Button>
            )}
          </div>
        )}
      </div>

      <AiPasteModal
        open={pasteOpen}
        onOpenChange={setPasteOpen}
        onExtracted={handleExtracted}
      />
    </div>
  );
}

function ActionChip({
  action,
  onClick,
}: {
  action: NonNullable<AssistantResponse["suggestedActions"]>[number];
  onClick: () => void;
}) {
  const labels: Record<typeof action, string> = {
    apply_community: "Apply community draft",
    apply_model: "Apply model draft",
    open_communities: "Open communities",
    paste_listing: "Paste listing",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full bg-background/80 px-2.5 py-1 text-[11px] font-medium text-foreground shadow-sm ring-1 ring-border transition-colors hover:bg-background"
    >
      {labels[action]}
    </button>
  );
}
