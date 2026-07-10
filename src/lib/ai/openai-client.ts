import {
  getOpenAiApiKey,
  getOpenAiContentModel,
  getOpenAiEmbeddingModel,
  getOpenAiSearchModel,
} from "./config";

const CHAT_URL = "https://api.openai.com/v1/chat/completions";
const EMBED_URL = "https://api.openai.com/v1/embeddings";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

type StructuredChatOptions = {
  model: string;
  messages: ChatMessage[];
  schema: Record<string, unknown>;
  schemaName: string;
  temperature?: number;
};

type TextChatOptions = {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
};

async function openAiFetch(
  url: string,
  body: Record<string, unknown>,
): Promise<Response> {
  const key = getOpenAiApiKey();
  if (!key) throw new Error("OPENAI_API_KEY not configured");

  return fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function parseChatContent(data: {
  choices?: Array<{ message?: { content?: string } }>;
}): string {
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error("Empty OpenAI response");
  return raw;
}

/** Structured Outputs — strict JSON schema. */
export async function openAiStructuredChat<T>(
  opts: StructuredChatOptions,
): Promise<T> {
  const res = await openAiFetch(CHAT_URL, {
    model: opts.model,
    temperature: opts.temperature ?? 0,
    messages: opts.messages,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: opts.schemaName,
        strict: true,
        schema: opts.schema,
      },
    },
  });

  if (!res.ok) throw new Error(await res.text());
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return JSON.parse(parseChatContent(data)) as T;
}

/** Plain text completion (no schema). */
export async function openAiTextChat(opts: TextChatOptions): Promise<string> {
  const res = await openAiFetch(CHAT_URL, {
    model: opts.model,
    temperature: opts.temperature ?? 0.7,
    messages: opts.messages,
  });

  if (!res.ok) throw new Error(await res.text());
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return parseChatContent(data).trim();
}

export async function openAiEmbed(text: string): Promise<number[] | null> {
  if (!text.trim() || !getOpenAiApiKey()) return null;

  try {
    const res = await openAiFetch(EMBED_URL, {
      model: getOpenAiEmbeddingModel(),
      input: text,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      data?: Array<{ embedding?: number[] }>;
    };
    return data.data?.[0]?.embedding ?? null;
  } catch {
    return null;
  }
}

export { getOpenAiSearchModel, getOpenAiContentModel, getOpenAiEmbeddingModel };
