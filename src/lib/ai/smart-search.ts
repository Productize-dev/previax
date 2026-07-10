import { getHomeListingCategories } from "@/lib/home-listing-categories";
import { getPriceRange } from "@/lib/community-utils";
import type { Community, HomeTag } from "@/lib/types";

import { applyAiFilters } from "./apply-filters";
import type { AiSearchFilters } from "./types";

export type AiSearchMatchMode = "exact" | "similar" | "semantic";

export type SmartSearchResult = {
  communityIds: string[];
  matchMode: AiSearchMatchMode;
  exactCount: number;
  total: number;
};

const MIN_RESULTS = 3;
const MAX_RESULTS = 20;
const EXACT_BONUS = 1_000;

function maxHomeStat(
  community: Community,
  field: "bedrooms" | "bathrooms",
): number {
  return Math.max(
    0,
    ...community.homes
      .filter((h) => h.status !== "sold")
      .map((h) => h[field]),
  );
}

function hasHomeTag(community: Community, tag: string): boolean {
  return community.homes
    .filter((h) => h.status !== "sold")
    .some((h) => (h.tags ?? []).includes(tag as HomeTag));
}

function hasListingCategory(
  community: Community,
  category: string,
): boolean {
  return community.homes
    .filter((h) => h.status !== "sold")
    .some((h) =>
      getHomeListingCategories(h, community).includes(
        category as ReturnType<typeof getHomeListingCategories>[number],
      ),
    );
}

function semanticBoost(
  communityId: string,
  semanticIds: string[],
): number {
  const index = semanticIds.indexOf(communityId);
  if (index < 0) return 0;
  return Math.round(((semanticIds.length - index) / semanticIds.length) * 40);
}

/** 0–100 relevance score for a community vs parsed filters. */
export function scoreCommunityRelevance(
  community: Community,
  filters: AiSearchFilters,
  semanticIds: string[] = [],
): number {
  let score = 0;

  const city = filters.city?.trim().toLowerCase();
  const cities = filters.cities?.map((c) => c.toLowerCase()) ?? [];
  const communityCity = community.city.toLowerCase();

  if (city) {
    score += communityCity === city ? 45 : -8;
  } else if (cities.length > 0) {
    score += cities.includes(communityCity) ? 35 : -5;
  }

  const range = getPriceRange(community);
  if (range) {
    if (filters.priceMax !== undefined) {
      if (range.min <= filters.priceMax) score += 35;
      else if (range.min <= filters.priceMax * 1.15) score += 22;
      else if (range.min <= filters.priceMax * 1.3) score += 12;
      else if (range.min <= filters.priceMax * 1.5) score += 4;
    }
    if (filters.priceMin !== undefined) {
      if (range.max >= filters.priceMin) score += 20;
      else if (range.max >= filters.priceMin * 0.85) score += 10;
    }
  } else if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    score -= 5;
  }

  if (filters.bedroomsMin !== undefined) {
    const maxBeds = maxHomeStat(community, "bedrooms");
    if (maxBeds >= filters.bedroomsMin) score += 28;
    else if (maxBeds >= filters.bedroomsMin - 1) score += 14;
    else if (maxBeds >= filters.bedroomsMin - 2) score += 6;
  }

  if (filters.bathroomsMin !== undefined) {
    const maxBaths = maxHomeStat(community, "bathrooms");
    if (maxBaths >= filters.bathroomsMin) score += 18;
    else if (maxBaths >= filters.bathroomsMin - 0.5) score += 8;
  }

  if (filters.offersOnly) {
    score += community.builderOffers.trim().length > 0 ? 18 : -6;
  }

  if (filters.goodSchools) {
    const hasSchools =
      Boolean(community.schoolDistrict?.trim()) ||
      (community.schools ?? []).some((s) => {
        const rating = Number.parseFloat(s.rating ?? "");
        return !Number.isNaN(rating) && rating >= 7;
      });
    score += hasSchools ? 15 : -4;
  }

  if (filters.patio) {
    score += hasHomeTag(community, "patio-home") ? 12 : -3;
  }

  if (filters.homeTags?.length) {
    const matched = filters.homeTags.filter((t) => hasHomeTag(community, t)).length;
    score += matched * 8;
    if (matched === 0) score -= 4;
  }

  if (filters.listingCategories?.length) {
    const matched = filters.listingCategories.filter((c) =>
      hasListingCategory(community, c),
    ).length;
    score += matched * 8;
    if (matched === 0) score -= 3;
  }

  if (filters.communityTags?.length) {
    const tags = new Set((community.tags ?? []).map((t) => t.toLowerCase()));
    const matched = filters.communityTags.filter((t) =>
      tags.has(t.toLowerCase()),
    ).length;
    score += matched * 6;
  }

  const textNeedle = (
    filters.semanticQuery ??
    filters.query ??
    ""
  ).toLowerCase();
  if (textNeedle) {
    const haystack = [
      community.name,
      community.city,
      community.builderName,
      community.description,
      community.tagline ?? "",
      community.mainHighlight ?? "",
      ...(community.amenities ?? []),
      ...(community.tags ?? []),
    ]
      .join(" ")
      .toLowerCase();

    const tokens = textNeedle
      .split(/\s+/)
      .filter((t) => t.length > 2);
    const hits = tokens.filter((t) => haystack.includes(t)).length;
    if (tokens.length > 0) {
      score += Math.round((hits / tokens.length) * 25);
    }
  }

  score += semanticBoost(community.id, semanticIds);

  return Math.max(0, score);
}

function rankByScore(
  catalog: Community[],
  scores: Map<string, number>,
): Community[] {
  return [...catalog].sort(
    (a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0),
  );
}

function pickTop(ordered: Community[], limit: number): Community[] {
  const picked: Community[] = [];
  for (const c of ordered) {
    if (picked.length >= limit) break;
    picked.push(c);
  }
  if (picked.length >= MIN_RESULTS) return picked;

  // Pad with any remaining if scores were too strict
  for (const c of ordered) {
    if (picked.length >= MIN_RESULTS) break;
    if (!picked.some((x) => x.id === c.id)) picked.push(c);
  }
  return picked.slice(0, limit);
}

/**
 * Exact filters first; if too few matches, blend similarity scoring + semantics.
 */
export function resolveSmartSearch(
  catalog: Community[],
  filters: AiSearchFilters,
  semanticIds: string[] = [],
  opts?: { minResults?: number; maxResults?: number },
): SmartSearchResult {
  const minResults = opts?.minResults ?? MIN_RESULTS;
  const maxResults = opts?.maxResults ?? MAX_RESULTS;

  if (catalog.length === 0) {
    return { communityIds: [], matchMode: "exact", exactCount: 0, total: 0 };
  }

  const exact = applyAiFilters(catalog, filters);
  const exactIdSet = new Set(exact.map((c) => c.id));

  const scores = new Map<string, number>();
  for (const c of catalog) {
    let score = scoreCommunityRelevance(c, filters, semanticIds);
    if (exactIdSet.has(c.id)) score += EXACT_BONUS;
    scores.set(c.id, score);
  }

  const ranked = rankByScore(catalog, scores);

  // Enough exact matches — return them (semantic re-rank within exact)
  if (exact.length >= minResults) {
    const exactRanked =
      semanticIds.length > 0
        ? [
            ...semanticIds
              .map((id) => exact.find((c) => c.id === id))
              .filter((c): c is Community => Boolean(c)),
            ...exact.filter((c) => !semanticIds.includes(c.id)),
          ]
        : exact;

    const ids = exactRanked.slice(0, maxResults).map((c) => c.id);
    return {
      communityIds: ids,
      matchMode: "exact",
      exactCount: ids.length,
      total: ids.length,
    };
  }

  // Mix exact + similar by score
  const blended = pickTop(ranked, maxResults);
  const blendedIds = blended.map((c) => c.id);
  const exactInBlend = blended.filter((c) => exactIdSet.has(c.id)).length;

  if (blendedIds.length > 0 && exactInBlend < blendedIds.length) {
    return {
      communityIds: blendedIds,
      matchMode: exactInBlend > 0 ? "similar" : "similar",
      exactCount: exactInBlend,
      total: blendedIds.length,
    };
  }

  // Semantic fallback from pgvector matches
  if (semanticIds.length > 0) {
    const semanticCommunities = semanticIds
      .map((id) => catalog.find((c) => c.id === id))
      .filter((c): c is Community => Boolean(c))
      .slice(0, maxResults);

    if (semanticCommunities.length > 0) {
      return {
        communityIds: semanticCommunities.map((c) => c.id),
        matchMode: "semantic",
        exactCount: semanticCommunities.filter((c) => exactIdSet.has(c.id)).length,
        total: semanticCommunities.length,
      };
    }
  }

  // Last resort: top scored overall (broad catalog)
  const fallback = ranked.slice(0, maxResults).map((c) => c.id);
  return {
    communityIds: fallback,
    matchMode: "similar",
    exactCount: fallback.filter((id) => exactIdSet.has(id)).length,
    total: fallback.length,
  };
}
