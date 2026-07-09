import { anthropicProvider } from "./anthropic-provider";
import { parseSearchHeuristic } from "./heuristic";
import { openAiProvider } from "./openai-provider";
import type { AiProvider, AiProviderName } from "./provider";
import type { AiSearchContext, AiSearchFilters } from "./types";

const heuristicProvider: AiProvider = {
  name: "heuristic",
  parseSearch: async (query, context) =>
    parseSearchHeuristic(query, context?.cities),
  embed: async () => null,
};

export function getAiProvider(): AiProvider {
  const name = (process.env.AI_PROVIDER ?? "openai").toLowerCase() as AiProviderName;

  if (name === "anthropic" && process.env.ANTHROPIC_API_KEY) {
    return anthropicProvider;
  }
  if (name === "openai" && process.env.OPENAI_API_KEY) {
    return openAiProvider;
  }
  if (process.env.OPENAI_API_KEY) return openAiProvider;
  if (process.env.ANTHROPIC_API_KEY) return anthropicProvider;
  return heuristicProvider;
}

export type { AiProvider, AiProviderName };
export type {
  AiSearchContext,
  AiSearchFilters,
  AiSearchResult,
  AiRecommendationRow,
  AiRecommendationsResult,
} from "./types";
export { parseSearchHeuristic } from "./heuristic";
export { applyAiFilters, rankBySemanticIds } from "./apply-filters";
export { buildRecommendationRows } from "./recommendations";
