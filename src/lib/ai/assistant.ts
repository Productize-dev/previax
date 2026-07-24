import { getOpenAiApiKey, getOpenAiContentModel } from "@/lib/ai/config";
import {
  extractListingHeuristic,
  extractListingWithAi,
  type ExtractedListingDraft,
} from "@/lib/ai/listing-extract";
import { openAiStructuredChat, openAiTextChat } from "@/lib/ai/openai-client";
import { aiConversationLanguageRule } from "@/lib/i18n/locale";

export type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AssistantCatalogHint = {
  communityCount: number;
  builderNames: string[];
  sampleCommunities: Array<{ name: string; city: string; models: number }>;
};

export type AssistantRequest = {
  message: string;
  history?: AssistantMessage[];
  catalog?: AssistantCatalogHint;
  /** When set, force extract from pasted listing text/url instead of free chat. */
  mode?: "chat" | "extract";
  extractText?: string;
  extractUrl?: string;
};

export type AssistantResponse = {
  reply: string;
  draft?: ExtractedListingDraft;
  suggestedActions?: Array<
    | "apply_community"
    | "apply_model"
    | "open_communities"
    | "paste_listing"
  >;
  source: "openai" | "heuristic";
};

const ASSISTANT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    reply: { type: "string" },
    intent: {
      type: "string",
      enum: [
        "chat",
        "extract_listing",
        "add_community",
        "add_model",
        "search_help",
      ],
    },
    suggestedActions: {
      type: "array",
      items: {
        type: "string",
        enum: [
          "apply_community",
          "apply_model",
          "open_communities",
          "paste_listing",
        ],
      },
    },
  },
  required: ["reply", "intent", "suggestedActions"],
} as const;

function catalogSummary(catalog?: AssistantCatalogHint): string {
  if (!catalog) return "Catalog stats unavailable.";
  const samples = catalog.sampleCommunities
    .slice(0, 8)
    .map((c) => `${c.name} (${c.city}, ${c.models} models)`)
    .join("; ");
  return [
    `${catalog.communityCount} communities in catalog.`,
    catalog.builderNames.length
      ? `Builders: ${catalog.builderNames.slice(0, 10).join(", ")}.`
      : "",
    samples ? `Examples: ${samples}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function looksLikeListing(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    text.length > 180 ||
    /\$[\d,]+/.test(text) ||
    /\b(bed|bath|sq\.?\s*ft|amenities|community|floor plan|from the \d)/i.test(
      lower,
    ) ||
    /^https?:\/\//i.test(text.trim())
  );
}

export async function runAdminAssistant(
  req: AssistantRequest,
): Promise<AssistantResponse> {
  const message = req.message.trim();
  if (!message && !req.extractText && !req.extractUrl) {
    return {
      reply: "Tell me what you need — paste a listing, ask about the catalog, or say “add a community”.",
      suggestedActions: ["paste_listing", "open_communities"],
      source: "heuristic",
    };
  }

  if (req.mode === "extract" || req.extractText || req.extractUrl) {
    const text = req.extractText?.trim() || message;
    const draft = await extractListingWithAi(text, req.extractUrl);
    const homeCount = draft.homes?.length ?? 0;
    return {
      reply:
        homeCount > 0
          ? `I extracted a draft for ${draft.community?.name ?? "a community"} with ${homeCount} model${homeCount === 1 ? "" : "s"}. Review and apply it to the forms.`
          : `I extracted a community draft for ${draft.community?.name ?? "a new listing"}. Apply it to the community form to continue.`,
      draft,
      suggestedActions: [
        "apply_community",
        ...(homeCount > 0 ? (["apply_model"] as const) : []),
        "open_communities",
      ],
      source: draft.source,
    };
  }

  if (looksLikeListing(message) && !getOpenAiApiKey()) {
    const draft = extractListingHeuristic(message);
    return {
      reply:
        "Looks like listing copy — I built a draft locally (AI key not configured). Apply it and review before saving.",
      draft,
      suggestedActions: ["apply_community", "apply_model", "open_communities"],
      source: "heuristic",
    };
  }

  if (looksLikeListing(message) && getOpenAiApiKey()) {
    const draft = await extractListingWithAi(message);
    return {
      reply: `That reads like a listing. I drafted ${draft.community?.name ?? "a community"}${
        draft.homes?.length
          ? ` with ${draft.homes.length} model${draft.homes.length === 1 ? "" : "s"}`
          : ""
      }. Apply the draft when you're ready.`,
      draft,
      suggestedActions: ["apply_community", "apply_model", "open_communities"],
      source: draft.source,
    };
  }

  if (!getOpenAiApiKey()) {
    return {
      reply: [
        "I'm online in helper mode (no OpenAI key).",
        "Paste brochure text or a listing URL and I'll extract a draft.",
        `Catalog: ${catalogSummary(req.catalog)}`,
      ].join("\n\n"),
      suggestedActions: ["paste_listing", "open_communities"],
      source: "heuristic",
    };
  }

  try {
    const history = (req.history ?? []).slice(-8);
    const structured = await openAiStructuredChat<{
      reply: string;
      intent: string;
      suggestedActions: AssistantResponse["suggestedActions"];
    }>({
      model: getOpenAiContentModel(),
      schemaName: "admin_assistant",
      schema: ASSISTANT_SCHEMA as unknown as Record<string, unknown>,
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content: [
            "You are Previax Admin Assistant for a new-home catalog dashboard.",
            "Help admins add/edit communities and model homes, search the catalog, and prepare listing drafts.",
            "Be concise and actionable. Never invent prices as facts — mark uncertain fields for review.",
            "If the user wants to add a listing from text/URL, set intent to extract_listing and tell them to paste the full text.",
            aiConversationLanguageRule(message),
            `Catalog context: ${catalogSummary(req.catalog)}`,
          ].join(" "),
        },
        ...history.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        { role: "user", content: message },
      ],
    });

    if (structured.intent === "extract_listing") {
      return {
        reply: structured.reply,
        suggestedActions: ["paste_listing", "open_communities"],
        source: "openai",
      };
    }

    return {
      reply: structured.reply,
      suggestedActions:
        structured.suggestedActions?.length
          ? structured.suggestedActions
          : ["open_communities", "paste_listing"],
      source: "openai",
    };
  } catch {
    const fallback = await openAiTextChat({
      model: getOpenAiContentModel(),
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content: `You are Previax Admin Assistant. Help manage communities and model homes. Be brief. ${aiConversationLanguageRule(message)}`,
        },
        { role: "user", content: message },
      ],
    }).catch(() => null);

    return {
      reply:
        fallback ??
        "I couldn't reach the model. Paste a listing and I'll still extract a draft.",
      suggestedActions: ["paste_listing", "open_communities"],
      source: fallback ? "openai" : "heuristic",
    };
  }
}
