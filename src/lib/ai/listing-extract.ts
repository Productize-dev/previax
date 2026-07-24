import type { CommunityInput, HomeInput, HomeTag } from "@/lib/types";
import { aiCatalogLanguageRule } from "@/lib/i18n/locale";

import { getOpenAiApiKey } from "./config";
import {
  getOpenAiContentModel,
  openAiStructuredChat,
  openAiTextChat,
} from "./openai-client";
import {
  LISTING_EXTRACT_SCHEMA,
  STRING_ARRAY_SCHEMA,
  TEXT_RESULT_SCHEMA,
} from "./schemas";

export type ExtractedListingDraft = {
  community?: Partial<CommunityInput> & {
    name?: string;
    city?: string;
    description?: string;
    amenities?: string[];
    tags?: string[];
    mainHighlight?: string;
    schoolDistrict?: string;
    youtubeUrl?: string;
  };
  homes?: Array<
    Partial<HomeInput> & {
      modelName?: string;
      description?: string;
      price?: number;
      bedrooms?: number;
      bathrooms?: number;
      sqft?: number;
      tags?: HomeTag[];
      highlights?: string[];
      youtubeUrl?: string;
    }
  >;
  source: "openai" | "heuristic";
};

const HEURISTIC_PRICE = /(?:\$|USD\s*)([\d,]+(?:\.\d+)?)\s*(k|m)?/i;
const HEURISTIC_BEDS = /(\d+)\s*(?:bed|br|rec[aá]maras?)/i;
const HEURISTIC_BATHS = /(\d+(?:\.\d+)?)\s*(?:bath|baño)/i;
const HEURISTIC_SQFT = /([\d,]+)\s*(?:sq\.?\s*ft|sqft|pies)/i;

/** Extracción local sin API — útil como fallback. */
export function extractListingHeuristic(text: string): ExtractedListingDraft {
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const firstLine = lines[0] ?? "";
  const name = firstLine.length < 80 ? firstLine : "New community";
  const description = lines.slice(1, 6).join("\n") || text.slice(0, 500);

  const priceMatch = text.match(HEURISTIC_PRICE);
  let price = 0;
  if (priceMatch) {
    price = Number(priceMatch[1].replace(/,/g, ""));
    if (priceMatch[2]?.toLowerCase() === "k") price *= 1000;
    if (priceMatch[2]?.toLowerCase() === "m") price *= 1_000_000;
  }

  const beds = text.match(HEURISTIC_BEDS);
  const baths = text.match(HEURISTIC_BATHS);
  const sqft = text.match(HEURISTIC_SQFT);

  const amenities = lines
    .filter((l) => /^[-•*]/.test(l) || /pool|clubhouse|trail|park/i.test(l))
    .map((l) => l.replace(/^[-•*]\s*/, ""))
    .slice(0, 8);

  const tags: string[] = [];
  if (/luxury|lujo/i.test(text)) tags.push("luxury");
  if (/gated|privad/i.test(text)) tags.push("gated");
  if (/townhome|townhome/i.test(text)) tags.push("townhomes");
  if (/master[\s-]?planned/i.test(text)) tags.push("master-planned");

  return {
    community: {
      name,
      description,
      amenities,
      tags,
      mainHighlight: description.slice(0, 60),
    },
    homes: [
      {
        modelName: name,
        description,
        price,
        bedrooms: beds ? Number(beds[1]) : 0,
        bathrooms: baths ? Number(baths[1]) : 0,
        sqft: sqft ? Number(sqft[1].replace(/,/g, "")) : 0,
        tags: ["move-in-ready"],
        highlights: amenities.slice(0, 4),
      },
    ],
    source: "heuristic",
  };
}

export async function extractListingWithAi(
  text: string,
  url?: string,
): Promise<ExtractedListingDraft> {
  if (!getOpenAiApiKey()) return extractListingHeuristic(text);

  const userContent = url
    ? `URL: ${url}\n\nContent:\n${text}`
    : text;

  try {
    const parsed = await openAiStructuredChat<ExtractedListingDraft>({
      model: getOpenAiContentModel(),
      schemaName: "listing_extract",
      schema: LISTING_EXTRACT_SCHEMA,
      messages: [
        {
          role: "system",
          content: [
            "Extract a new-home community listing from brochure text (any input language).",
            aiCatalogLanguageRule(),
            "Tags should be slug-like (e.g. master-planned, townhomes). Use null for unknown optional fields.",
          ].join(" "),
        },
        { role: "user", content: userContent },
      ],
    });
    return { ...parsed, source: "openai" };
  } catch {
    return extractListingHeuristic(text);
  }
}

export type ContentGenerateRequest = {
  type:
    | "community-description"
    | "community-highlights"
    | "community-tags"
    | "home-description"
    | "home-highlights"
    | "home-tags";
  context: Record<string, unknown>;
};

export async function generateContentWithAi(
  req: ContentGenerateRequest,
): Promise<{ result: string | string[]; source: "openai" | "heuristic" }> {
  const { type, context } = req;

  if (!getOpenAiApiKey()) {
    return { result: heuristicGenerate(type, context), source: "heuristic" };
  }

  const model = getOpenAiContentModel();
  const contextJson = JSON.stringify(context);

  try {
    if (type === "community-tags" || type === "home-tags" || type === "home-highlights") {
      const prompts: Record<string, string> = {
        "community-tags":
          "Suggest 3-6 community tags as slug strings for this community.",
        "home-tags":
          "Suggest home tags from: move-in-ready, under-construction, custom-build, patio-home, single-story, basement.",
        "home-highlights": "Suggest 4 bullet highlights for this home model.",
      };

      const { items } = await openAiStructuredChat<{ items: string[] }>({
        model,
        schemaName: "string_array",
        schema: STRING_ARRAY_SCHEMA,
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: `${prompts[type]} ${aiCatalogLanguageRule()} Context: ${contextJson}`,
          },
          { role: "user", content: "Generate now." },
        ],
      });
      return { result: items, source: "openai" };
    }

    const prompts: Record<string, string> = {
      "community-description":
        "Write a 2-3 sentence community description for a new home community.",
      "community-highlights":
        "Write one short main highlight (max 60 chars) for this community.",
      "home-description": "Write a 2 sentence model home description.",
    };

    const { text } = await openAiStructuredChat<{ text: string }>({
      model,
      schemaName: "text_result",
      schema: TEXT_RESULT_SCHEMA,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `${prompts[type]} ${aiCatalogLanguageRule()} Context: ${contextJson}`,
        },
        { role: "user", content: "Generate now." },
      ],
    });
    return { result: text.trim(), source: "openai" };
  } catch {
    return { result: heuristicGenerate(type, context), source: "heuristic" };
  }
}

function heuristicGenerate(
  type: ContentGenerateRequest["type"],
  context: Record<string, unknown>,
): string | string[] {
  const name = String(context.name ?? "Community");
  const city = String(context.city ?? "");
  switch (type) {
    case "community-description":
      return `${name} in ${city} offers new construction homes with modern floor plans and community amenities.`;
    case "community-highlights":
      return `New homes in ${city}`.slice(0, 60);
    case "community-tags":
      return ["new-construction", "master-planned"];
    case "home-description":
      return `The ${context.modelName ?? "model"} features an open layout with quality finishes throughout.`;
    case "home-highlights":
      return ["Open-concept living", "Energy-efficient design", "Spacious primary suite"];
    case "home-tags":
      return ["move-in-ready"];
    default:
      return "";
  }
}
