import type { CommunityInput, HomeInput, HomeTag } from "@/lib/types";
import { aiCatalogLanguageRule } from "@/lib/i18n/locale";

import { getOpenAiApiKey } from "./config";
import {
  getOpenAiContentModel,
  openAiStructuredChat,
} from "./openai-client";
import {
  COMMUNITY_ORGANIZE_SCHEMA,
  LISTING_EXTRACT_SCHEMA,
  STRING_ARRAY_SCHEMA,
  TEXT_RESULT_SCHEMA,
} from "./schemas";

export type ExtractedCommunityFields = Partial<CommunityInput> & {
  name?: string;
  city?: string;
  builderName?: string;
  description?: string;
  amenities?: string[];
  tags?: string[];
  mainHighlight?: string;
  tagline?: string;
  schoolDistrict?: string;
  lifestyleNotes?: string;
  thumbnailUrl?: string;
  youtubeUrl?: string;
  lenders?: string[];
};

export type ExtractedListingDraft = {
  community?: ExtractedCommunityFields;
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
  organized?: boolean;
};

const HEURISTIC_PRICE = /(?:\$|USD\s*)([\d,]+(?:\.\d+)?)\s*(k|m)?/i;
const HEURISTIC_BEDS = /(\d+)\s*(?:bed|br|rec[aá]maras?)/i;
const HEURISTIC_BATHS = /(\d+(?:\.\d+)?)\s*(?:bath|baño)/i;
const HEURISTIC_SQFT = /([\d,]+)\s*(?:sq\.?\s*ft|sqft|pies)/i;

const AMENITY_SIGNAL =
  /\b(pool|clubhouse|trail|trails|park|parks|playground|fitness|gym|amenit|gated|dog\s*park|pickleball|tennis|splash|lake|golf|cabana|resort)\b/i;

const FIELD_PLACEMENT_RULES = [
  "Place each fact in exactly ONE correct field. Never dump overview text into amenities.",
  "name: community / subdivision name only.",
  "city: city and state if available (e.g. \"Austin, TX\").",
  "builderName: home builder company name if present, else null.",
  "description: polished 2-4 sentence community overview. Not a bullet list.",
  "tagline: short slogan (max ~80 chars) or null.",
  "mainHighlight: ONE short selling point (max ~60 chars).",
  "schoolDistrict: school district name only, or null. Not a list of schools.",
  "lifestyleNotes: commute, vibe, nearby lifestyle — short prose. Not amenities.",
  "amenities: ONLY short community facility/feature labels (pool, clubhouse, trails, playground, fitness center, parks, gated entry, etc.). Max 12 items. No paragraphs, prices, phones, addresses, legal text, nav chrome, or model specs.",
  "thumbnailUrl: community image URL if clearly present, else null.",
  "youtubeUrl: YouTube URL if present, else null.",
  "tags: slug-like (master-planned, gated, luxury, townhomes, new-construction).",
  "lenders: lender names only if mentioned.",
  "DELETE irrelevant content: cookie banners, login prompts, footers, copyright, brokerage disclaimers, menus, duplicate lines.",
  "If something was wrongly put in amenities, move it to the right field and remove it from amenities.",
].join(" ");

/** Extracción local sin API — útil como fallback. */
export function extractListingHeuristic(text: string): ExtractedListingDraft {
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const firstLine = lines[0] ?? "";
  const name = firstLine.length < 80 ? firstLine : "New community";
  const description = lines.slice(1, 6).join(" ") || text.slice(0, 500);

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
    .filter((l) => l.length < 60 && AMENITY_SIGNAL.test(l))
    .map((l) => l.replace(/^[-•*]\s*/, ""))
    .slice(0, 8);

  const tags: string[] = [];
  if (/luxury|lujo/i.test(text)) tags.push("luxury");
  if (/gated|privad/i.test(text)) tags.push("gated");
  if (/townhome|townhome/i.test(text)) tags.push("townhomes");
  if (/master[\s-]?planned/i.test(text)) tags.push("master-planned");

  const schoolMatch = text.match(
    /([A-Z][\w\s&'-]{2,40}\s(?:ISD|CSD|USD|School District))/i,
  );

  return {
    community: {
      name,
      description,
      amenities,
      tags,
      mainHighlight: description.slice(0, 60),
      schoolDistrict: schoolMatch?.[1]?.trim(),
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

type OrganizedCommunity = {
  name: string;
  city: string | null;
  builderName: string | null;
  description: string | null;
  tagline: string | null;
  mainHighlight: string | null;
  amenities: string[];
  tags: string[];
  schoolDistrict: string | null;
  lifestyleNotes: string | null;
  thumbnailUrl: string | null;
  youtubeUrl: string | null;
  lenders: string[];
};

function nullToUndefined<T>(value: T | null | undefined): T | undefined {
  return value == null ? undefined : value;
}

function applyOrganizedCommunity(
  draft: ExtractedListingDraft,
  organized: OrganizedCommunity,
): ExtractedListingDraft {
  return {
    ...draft,
    organized: true,
    community: {
      ...draft.community,
      name: organized.name,
      city: nullToUndefined(organized.city),
      builderName: nullToUndefined(organized.builderName),
      description: nullToUndefined(organized.description),
      tagline: nullToUndefined(organized.tagline),
      mainHighlight: nullToUndefined(organized.mainHighlight),
      amenities: organized.amenities.slice(0, 12),
      tags: organized.tags,
      schoolDistrict: nullToUndefined(organized.schoolDistrict),
      lifestyleNotes: nullToUndefined(organized.lifestyleNotes),
      thumbnailUrl: nullToUndefined(organized.thumbnailUrl),
      youtubeUrl: nullToUndefined(organized.youtubeUrl),
      lenders: organized.lenders,
    },
  };
}

/**
 * Second AI pass: move facts into the correct community fields and drop junk.
 * Especially fixes amenities becoming a dump of the whole listing.
 */
export async function organizeCommunityFieldsWithAi(
  draft: ExtractedListingDraft,
  sourceText: string,
): Promise<ExtractedListingDraft> {
  if (!getOpenAiApiKey() || !draft.community) return draft;

  try {
    const organized = await openAiStructuredChat<OrganizedCommunity>({
      model: getOpenAiContentModel(),
      schemaName: "community_organize",
      schema: COMMUNITY_ORGANIZE_SCHEMA,
      temperature: 0,
      messages: [
        {
          role: "system",
          content: [
            "You reorganize an already-extracted new-home community draft into the correct form fields.",
            aiCatalogLanguageRule(),
            FIELD_PLACEMENT_RULES,
            "Return only the cleaned community fields. Prefer moving misplaced content over inventing new facts.",
          ].join(" "),
        },
        {
          role: "user",
          content: JSON.stringify({
            currentDraft: draft.community,
            sourceExcerpt: sourceText.slice(0, 8000),
          }),
        },
      ],
    });

    return applyOrganizedCommunity(draft, organized);
  } catch {
    return draft;
  }
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
            "Extract a new-home community listing from brochure / website text.",
            aiCatalogLanguageRule(),
            FIELD_PLACEMENT_RULES,
            "Also extract home models into homes when present. Use null for unknown optional fields.",
          ].join(" "),
        },
        { role: "user", content: userContent },
      ],
    });

    const draft: ExtractedListingDraft = { ...parsed, source: "openai" };
    return organizeCommunityFieldsWithAi(draft, text);
  } catch {
    const heuristic = extractListingHeuristic(text);
    return organizeCommunityFieldsWithAi(heuristic, text);
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
    if (
      type === "community-tags" ||
      type === "home-tags" ||
      type === "home-highlights"
    ) {
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
      return [
        "Open-concept living",
        "Energy-efficient design",
        "Spacious primary suite",
      ];
    case "home-tags":
      return ["move-in-ready"];
    default:
      return "";
  }
}
