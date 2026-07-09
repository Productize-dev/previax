import type { AiProvider } from "./provider";
import type { AiSearchContext, AiSearchFilters } from "./types";
import { parseSearchHeuristic } from "./heuristic";

const MODEL = "gpt-4o-mini";
const EMBED_MODEL = "text-embedding-3-small";

function getKey(): string | undefined {
  return process.env.OPENAI_API_KEY?.trim() || undefined;
}

const FILTER_SCHEMA = `{
  "city": "string or null — single city name",
  "cities": ["array of city names"] or null,
  "priceMin": number or null,
  "priceMax": number or null,
  "bedroomsMin": number or null,
  "bathroomsMin": number or null,
  "homeTags": ["move-in-ready"|"under-construction"|"custom-build"|"patio-home"|"single-story"|"basement"] or null,
  "listingCategories": ["zero-down"|"one-level"|"master-on-main-3-beds"|"big-incentives"|"top-ten"] or null,
  "offersOnly": boolean,
  "goodSchools": boolean,
  "patio": boolean,
  "semanticQuery": "short English phrase for semantic search"
}`;

export const openAiProvider: AiProvider = {
  name: "openai",

  async parseSearch(query, context) {
    const key = getKey();
    if (!key) return parseSearchHeuristic(query, context?.cities);

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `You extract home search filters from natural language (English or Spanish). Return ONLY valid JSON matching: ${FILTER_SCHEMA}. Known cities in catalog: ${(context?.cities ?? []).join(", ") || "none"}. Buyer saved community count: ${context?.savedIds?.length ?? 0}.`,
            },
            { role: "user", content: query },
          ],
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const raw = data.choices?.[0]?.message?.content;
      if (!raw) throw new Error("Empty AI response");
      const parsed = JSON.parse(raw) as AiSearchFilters;
      return { ...parsed, semanticQuery: parsed.semanticQuery ?? query };
    } catch {
      return parseSearchHeuristic(query, context?.cities);
    }
  },

  async embed(text) {
    const key = getKey();
    if (!key || !text.trim()) return null;

    try {
      const res = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: EMBED_MODEL, input: text }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as {
        data?: Array<{ embedding?: number[] }>;
      };
      return data.data?.[0]?.embedding ?? null;
    } catch {
      return null;
    }
  },
};
