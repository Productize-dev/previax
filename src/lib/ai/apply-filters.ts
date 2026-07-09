import { getHomeListingCategories } from "@/lib/home-listing-categories";
import { getPriceRange } from "@/lib/community-utils";
import type { Community, Home } from "@/lib/types";

import type { AiSearchFilters } from "./types";

function communityMatchesHome(
  community: Community,
  predicate: (home: Home) => boolean,
): boolean {
  const homes = community.homes.filter((h) => h.status !== "sold");
  return homes.some(predicate);
}

function hasGoodSchools(community: Community): boolean {
  if (community.schoolDistrict?.trim()) return true;
  return (community.schools ?? []).some((s) => {
    const rating = Number.parseFloat(s.rating ?? "");
    return !Number.isNaN(rating) && rating >= 7;
  });
}

/** Aplica filtros estructurados de IA sobre el catálogo en memoria. */
export function applyAiFilters(
  communities: Community[],
  filters: AiSearchFilters,
): Community[] {
  let result = communities;

  const city =
    filters.city && filters.city !== "all" ? filters.city : undefined;
  const cities = filters.cities?.length ? filters.cities : undefined;

  if (city) {
    result = result.filter((c) => c.city.toLowerCase() === city.toLowerCase());
  } else if (cities?.length) {
    const set = new Set(cities.map((c) => c.toLowerCase()));
    result = result.filter((c) => set.has(c.city.toLowerCase()));
  }

  if (filters.offersOnly) {
    result = result.filter((c) => c.builderOffers.trim().length > 0);
  }

  if (filters.goodSchools) {
    result = result.filter(hasGoodSchools);
  }

  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    result = result.filter((c) => {
      const range = getPriceRange(c);
      if (!range) return false;
      if (filters.priceMin !== undefined && range.max < filters.priceMin) {
        return false;
      }
      if (filters.priceMax !== undefined && range.min > filters.priceMax) {
        return false;
      }
      return true;
    });
  }

  if (filters.bedroomsMin !== undefined) {
    const min = filters.bedroomsMin;
    result = result.filter((c) =>
      communityMatchesHome(c, (h) => h.bedrooms >= min),
    );
  }

  if (filters.bathroomsMin !== undefined) {
    const min = filters.bathroomsMin;
    result = result.filter((c) =>
      communityMatchesHome(c, (h) => h.bathrooms >= min),
    );
  }

  if (filters.homeTags?.length) {
    const tags = new Set(filters.homeTags);
    result = result.filter((c) =>
      communityMatchesHome(c, (h) =>
        (h.tags ?? []).some((t) => tags.has(t)),
      ),
    );
  }

  if (filters.patio) {
    result = result.filter((c) =>
      communityMatchesHome(c, (h) => (h.tags ?? []).includes("patio-home")),
    );
  }

  if (filters.listingCategories?.length) {
    const cats = new Set(filters.listingCategories);
    result = result.filter((c) =>
      communityMatchesHome(c, (h) =>
        getHomeListingCategories(h, c).some((cat) => cats.has(cat)),
      ),
    );
  }

  if (filters.communityTags?.length) {
    const tags = new Set(filters.communityTags.map((t) => t.toLowerCase()));
    result = result.filter((c) =>
      (c.tags ?? []).some((t) => tags.has(t.toLowerCase())),
    );
  }

  if (filters.query?.trim()) {
    const q = filters.query.toLowerCase();
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.builderName.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q),
    );
  }

  return result;
}

/** Reordena comunidades: primero las de match semántico (por score), luego el resto. */
export function rankBySemanticIds(
  communities: Community[],
  semanticIds: string[],
): Community[] {
  if (semanticIds.length === 0) return communities;

  const order = new Map(semanticIds.map((id, i) => [id, i]));
  const matched: Community[] = [];
  const rest: Community[] = [];

  for (const c of communities) {
    if (order.has(c.id)) matched.push(c);
    else rest.push(c);
  }

  matched.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  return [...matched, ...rest];
}
