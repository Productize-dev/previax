import { getOpenAiApiKey } from "./config";
import { parseSearchHeuristic } from "./heuristic";
import {
  getOpenAiSearchModel,
  openAiEmbed,
  openAiStructuredChat,
} from "./openai-client";
import type { AiProvider } from "./provider";
import { SEARCH_FILTERS_SCHEMA } from "./schemas";
import type { AiSearchContext, AiSearchFilters } from "./types";
import { aiSearchLanguageRule } from "@/lib/i18n/locale";

export const openAiProvider: AiProvider = {
  name: "openai",

  async parseSearch(query, context) {
    if (!getOpenAiApiKey()) {
      return parseSearchHeuristic(query, context?.cities);
    }

    try {
      const parsed = await openAiStructuredChat<AiSearchFilters>({
        model: getOpenAiSearchModel(),
        schemaName: "search_filters",
        schema: SEARCH_FILTERS_SCHEMA,
        messages: [
          {
            role: "system",
            content: [
              aiSearchLanguageRule(),
              `Known cities in catalog: ${(context?.cities ?? []).join(", ") || "none"}.`,
              `Buyer saved community count: ${context?.savedIds?.length ?? 0}.`,
              "Set unused fields to null.",
            ].join(" "),
          },
          { role: "user", content: query },
        ],
      });
      return { ...parsed, semanticQuery: parsed.semanticQuery || query };
    } catch {
      return parseSearchHeuristic(query, context?.cities);
    }
  },

  embed: openAiEmbed,
};
