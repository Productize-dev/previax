import type { AiProvider } from "./provider";
import type { AiSearchContext, AiSearchFilters } from "./types";
import { parseSearchHeuristic } from "./heuristic";
import { openAiProvider } from "./openai-provider";

const MODEL = "claude-sonnet-4-20250514";

function getKey(): string | undefined {
  return process.env.ANTHROPIC_API_KEY?.trim() || undefined;
}

export const anthropicProvider: AiProvider = {
  name: "anthropic",

  async parseSearch(query, context) {
    const key = getKey();
    if (!key) return parseSearchHeuristic(query, context?.cities);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1024,
          messages: [
            {
              role: "user",
              content: `Extract home search filters as JSON only (no markdown). Schema fields: city, cities[], priceMin, priceMax, bedroomsMin, bathroomsMin, homeTags[], listingCategories[], offersOnly, goodSchools, patio, semanticQuery. Known cities: ${(context?.cities ?? []).join(", ")}. Query: ${query}`,
            },
          ],
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as {
        content?: Array<{ type: string; text?: string }>;
      };
      const text = data.content?.find((c) => c.type === "text")?.text;
      if (!text) throw new Error("Empty AI response");
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in response");
      const parsed = JSON.parse(jsonMatch[0]) as AiSearchFilters;
      return { ...parsed, semanticQuery: parsed.semanticQuery ?? query };
    } catch {
      return parseSearchHeuristic(query, context?.cities);
    }
  },

  // Anthropic has no embeddings API — reuse OpenAI if configured.
  async embed(text) {
    return openAiProvider.embed(text);
  },
};
