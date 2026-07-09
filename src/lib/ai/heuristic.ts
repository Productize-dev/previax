import type { HomeTag } from "@/lib/types";
import type { AiSearchFilters } from "./types";

const HOME_TAG_PATTERNS: Array<{ pattern: RegExp; tag: HomeTag[] }> = [
  { pattern: /\b(move[\s-]?in[\s-]?ready|lista para mudarse)\b/i, tag: ["move-in-ready"] },
  { pattern: /\b(under[\s-]?construction|en construcción)\b/i, tag: ["under-construction"] },
  { pattern: /\b(custom[\s-]?build|a medida)\b/i, tag: ["custom-build"] },
  { pattern: /\b(patio|backyard|jardín|patio-home)\b/i, tag: ["patio-home"] },
  { pattern: /\b(single[\s-]?stor(y|ies)|una planta|un nivel|one[\s-]?level)\b/i, tag: ["single-story"] },
  { pattern: /\b(basement|sótano|sotano)\b/i, tag: ["basement"] },
];

const LISTING_PATTERNS: Array<{
  pattern: RegExp;
  cat: NonNullable<AiSearchFilters["listingCategories"]>[number];
}> = [
  { pattern: /\b(zero[\s-]?down|sin enganche|0% down)\b/i, cat: "zero-down" },
  { pattern: /\b(big incentives|grandes incentivos)\b/i, cat: "big-incentives" },
  { pattern: /\b(master on main|principal en planta baja)\b/i, cat: "master-on-main-3-beds" },
  { pattern: /\b(top[\s-]?10|top ten)\b/i, cat: "top-ten" },
];

function parsePrice(text: string): { min?: number; max?: number } {
  const lower = text.toLowerCase();
  const result: { min?: number; max?: number } = {};

  const under = lower.match(
    /(?:under|below|less than|menos de|bajo|hasta)\s*\$?\s*([\d,.]+)\s*(k|m|mil)?/i,
  );
  if (under) {
    let n = Number(under[1].replace(/,/g, ""));
    if (under[2]?.toLowerCase() === "m") n *= 1_000_000;
    else if (under[2] || n < 10_000) n *= 1_000;
    result.max = n;
  }

  const over = lower.match(
    /(?:over|above|more than|más de|desde)\s*\$?\s*([\d,.]+)\s*(k|m|mil)?/i,
  );
  if (over) {
    let n = Number(over[1].replace(/,/g, ""));
    if (over[2]?.toLowerCase() === "m") n *= 1_000_000;
    else if (over[2] || n < 10_000) n *= 1_000;
    result.min = n;
  }

  const range = lower.match(
    /\$?\s*([\d,.]+)\s*(k|m)?\s*[-–]\s*\$?\s*([\d,.]+)\s*(k|m)?/i,
  );
  if (range) {
    let min = Number(range[1].replace(/,/g, ""));
    let max = Number(range[3].replace(/,/g, ""));
    if (range[2]?.toLowerCase() === "m") min *= 1_000_000;
    else if (range[2] || min < 10_000) min *= 1_000;
    if (range[4]?.toLowerCase() === "m") max *= 1_000_000;
    else if (range[4] || max < 10_000) max *= 1_000;
    result.min = min;
    result.max = max;
  }

  return result;
}

function parseBedrooms(text: string): number | undefined {
  const m = text.match(
    /(\d+)\s*(?:bed(?:room)?s?|rec[aá]maras?|habitaciones?|br\b)/i,
  );
  return m ? Number(m[1]) : undefined;
}

function parseBathrooms(text: string): number | undefined {
  const m = text.match(/(\d+(?:\.\d+)?)\s*(?:bath(?:room)?s?|baños?)/i);
  return m ? Number(m[1]) : undefined;
}

function extractCities(text: string, knownCities: string[]): string[] {
  const lower = text.toLowerCase();
  return knownCities.filter((city) => lower.includes(city.toLowerCase()));
}

/** Parser local sin API — fallback cuando no hay key o la IA falla. */
export function parseSearchHeuristic(
  query: string,
  knownCities: string[] = [],
): AiSearchFilters {
  const lower = query.toLowerCase();
  const filters: AiSearchFilters = { semanticQuery: query.trim() };

  const prices = parsePrice(query);
  if (prices.min !== undefined) filters.priceMin = prices.min;
  if (prices.max !== undefined) filters.priceMax = prices.max;

  const beds = parseBedrooms(query);
  if (beds) filters.bedroomsMin = beds;

  const baths = parseBathrooms(query);
  if (baths) filters.bathroomsMin = baths;

  const cities = extractCities(query, knownCities);
  if (cities.length === 1) filters.city = cities[0];
  if (cities.length > 0) filters.cities = cities;

  if (/\b(good schools|great schools|buenas escuelas|escuelas)\b/i.test(query)) {
    filters.goodSchools = true;
  }

  if (/\b(offer|incentive|promo|oferta)\b/i.test(query)) {
    filters.offersOnly = true;
  }

  if (/\b(patio|backyard|jardín)\b/i.test(query)) {
    filters.patio = true;
  }

  const homeTags = new Set<NonNullable<AiSearchFilters["homeTags"]>[number]>();
  for (const { pattern, tag } of HOME_TAG_PATTERNS) {
    if (pattern.test(query) && tag) tag.forEach((t) => homeTags.add(t));
  }
  if (homeTags.size > 0) filters.homeTags = [...homeTags];

  const listingCategories = new Set<
    NonNullable<AiSearchFilters["listingCategories"]>[number]
  >();
  for (const { pattern, cat } of LISTING_PATTERNS) {
    if (pattern.test(query)) listingCategories.add(cat);
  }
  if (listingCategories.size > 0) {
    filters.listingCategories = [...listingCategories];
  }

  // Residual keywords not captured structurally
  const stripped = lower
    .replace(/\b(under|below|over|above|near|in|cerca de|con|with|and|y)\b/g, " ")
    .replace(/\$[\d,.]+k?/g, " ")
    .replace(/\d+\s*(?:bed|bath|rec[aá]maras?|baños?)/g, " ");
  const tokens = stripped
    .split(/\s+/)
    .filter((t) => t.length > 2 && !knownCities.some((c) => c.toLowerCase() === t));
  if (tokens.length > 0 && !filters.query) {
    filters.query = tokens.join(" ").trim() || undefined;
  }

  return filters;
}
