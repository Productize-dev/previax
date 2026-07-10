import { isOpenAiConfigured } from "./config";
import { parseSearchHeuristic } from "./heuristic";
import { openAiProvider } from "./openai-provider";
import type { AiProvider } from "./provider";

const heuristicProvider: AiProvider = {
  name: "heuristic",
  parseSearch: async (query, context) =>
    parseSearchHeuristic(query, context?.cities),
  embed: async () => null,
};

/** OpenAI-first provider selection. Anthropic can be re-enabled later via AI_PROVIDER. */
export function getAiProvider(): AiProvider {
  if (isOpenAiConfigured()) return openAiProvider;
  return heuristicProvider;
}

export type { AiProvider, AiProviderName } from "./provider";
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
export {
  resolveSmartSearch,
  scoreCommunityRelevance,
  type AiSearchMatchMode,
  type SmartSearchResult,
} from "./smart-search";
