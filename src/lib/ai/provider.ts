import type { AiSearchContext, AiSearchFilters } from "./types";

export type AiProviderName = "openai" | "anthropic" | "heuristic";

export interface AiProvider {
  readonly name: AiProviderName;
  parseSearch(
    query: string,
    context?: AiSearchContext,
  ): Promise<AiSearchFilters>;
  embed(text: string): Promise<number[] | null>;
}
