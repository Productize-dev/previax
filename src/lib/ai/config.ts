/** OpenAI model defaults — override via env vars. */

export const OPENAI_EMBEDDING_DIMENSIONS = 1536;

export function getOpenAiApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY?.trim() || undefined;
}

export function getOpenAiEmbeddingModel(): string {
  return process.env.OPENAI_EMBEDDING_MODEL?.trim() || "text-embedding-3-small";
}

/** NL search parsing — Structured Outputs. */
export function getOpenAiSearchModel(): string {
  return process.env.OPENAI_SEARCH_MODEL?.trim() || "gpt-4.1-mini";
}

/** Listing extraction + content generation. */
export function getOpenAiContentModel(): string {
  return process.env.OPENAI_CONTENT_MODEL?.trim() || "gpt-4.1";
}

export function isOpenAiConfigured(): boolean {
  return Boolean(getOpenAiApiKey());
}
