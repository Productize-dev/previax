import type {
  CommunityTag,
  HomeListingCategory,
  HomeTag,
} from "@/lib/types";

/** Filtros estructurados devueltos por parseSearch (NL → JSON). */
export type AiSearchFilters = {
  /** Texto libre residual para búsqueda por substring. */
  query?: string;
  city?: string;
  cities?: string[];
  priceMin?: number;
  priceMax?: number;
  bedroomsMin?: number;
  bathroomsMin?: number;
  homeTags?: HomeTag[];
  communityTags?: CommunityTag[];
  listingCategories?: HomeListingCategory[];
  offersOnly?: boolean;
  /** Comunidades con distrito escolar o escuelas bien calificadas. */
  goodSchools?: boolean;
  patio?: boolean;
  /** Query limpia para embedding semántico. */
  semanticQuery?: string;
};

export type AiSearchContext = {
  savedIds?: string[];
  cities?: string[];
  budget?: string;
  beds?: string;
  buyerEmail?: string;
};

export type AiSearchResult = {
  filters: AiSearchFilters;
  semanticIds: string[];
  source: "openai" | "anthropic" | "heuristic";
  matchMode?: "exact" | "similar" | "semantic";
  exactCount?: number;
};

export type AiRecommendationRow = {
  id: string;
  title: string;
  type: "community" | "home";
  communityIds?: string[];
  homeIds?: Array<{ communityId: string; homeId: string }>;
};

export type AiRecommendationsResult = {
  rows: AiRecommendationRow[];
  source: "openai" | "anthropic" | "heuristic";
};
