import type {
  Builder,
  BuilderInput,
  Community,
  CommunityInput,
  CommunityReview,
  FeaturedCommunityRow,
  FeaturedItem,
  FeaturedItemInput,
  Home,
  HomeInput,
  HomeListingCategory,
  HomeReview,
  HomeRoom,
  HomeStatus,
  HomeTag,
  HomepageSeriesRow,
  HomepageSection,
  HomepageSectionKey,
  Lender,
  LenderInput,
  LenderOffer,
  LenderOfferInput,
  MediaItem,
  NearbyPlace,
  SchoolInfo,
  Series,
  SeriesInput,
  Top10CommunitySlot,
  Top10Period,
} from "../types";

// ---------------------------------------------------------------------
// Row shapes (snake_case) as returned by PostgREST
// ---------------------------------------------------------------------

export type BuilderRow = {
  id: string;
  owner_id: string | null;
  name: string;
  logo_url: string | null;
  description: string | null;
  created_at: string;
};

export type SeriesRow = {
  id: string;
  builder_id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  youtube_url: string | null;
  created_at: string;
};

export type CommunityRow = {
  id: string;
  owner_id: string | null;
  builder_id: string | null;
  name: string;
  city: string;
  description: string;
  thumbnail_url: string;
  youtube_url: string;
  builder_name: string;
  is_multi_builder: boolean;
  builder_ids: string[];
  builder_offers: string;
  tags: string[];
  realtor_name: string;
  realtor_phone: string;
  realtor_email: string;
  realtor_photo_url: string;
  amenities: string[];
  lenders: string[];
  main_highlight: string | null;
  school_district: string | null;
  commute_notes: string | null;
  hoa_range: string | null;
  offer_expires: string | null;
  latitude: number | null;
  longitude: number | null;
  tagline: string | null;
  lifestyle_notes: string | null;
  school_overview: string | null;
  schools: SchoolInfo[];
  dining_overview: string | null;
  nearby_places: NearbyPlace[];
  reviews: CommunityReview[];
  media_gallery: MediaItem[];
  view_count: number;
  save_count: number;
  created_at: string;
};

export type HomeRow = {
  id: string;
  community_id: string;
  series_id: string | null;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  model_name: string | null;
  address: string | null;
  image_urls: string[];
  description: string;
  youtube_url: string | null;
  status: HomeStatus | null;
  tags: HomeTag[];
  listing_categories: HomeListingCategory[];
  tagline: string | null;
  features_overview: string | null;
  highlights: string[];
  rooms: HomeRoom[];
  media_gallery: MediaItem[];
  reviews: HomeReview[];
  created_at: string;
};

export type LenderRow = {
  id: string;
  owner_id: string | null;
  name: string;
  description: string;
  image_url: string | null;
  sort_order: number;
};

export type FeaturedItemRow = {
  id: string;
  title: string;
  subtitle: string;
  youtube_url: string;
  community_id: string | null;
  sort_order: number;
};

export type FeaturedCommunityRowRow = {
  id: string;
  community_id: string;
  sort_order: number;
};

export type HomepageSectionRow = {
  id: string;
  section_key: string;
  title: string | null;
  enabled: boolean;
  sort_order: number;
};

export type LenderOfferRow = {
  id: string;
  lender_id: string;
  community_id: string | null;
  title: string;
  rate: string | null;
  terms: string | null;
  description: string;
  image_url: string | null;
  valid_until: string | null;
  is_active: boolean;
};

export type Top10Row = {
  id: string;
  community_id: string;
  rank: number;
  period: Top10Period;
  is_auto: boolean;
};

export type HomepageSeriesRowRow = {
  id: string;
  series_id: string;
  sort_order: number;
};

export type TagLabelRow = {
  slug: string;
  label: string;
};

export type ActivityEventRow = {
  id: string;
  actor_id: string | null;
  type: string;
  entity_id: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

// ---------------------------------------------------------------------
// Row -> TS type (camelCase)
// ---------------------------------------------------------------------

function toMillis(timestamptz: string): number {
  const ms = Date.parse(timestamptz);
  return Number.isNaN(ms) ? Date.now() : ms;
}

export function rowToBuilder(row: BuilderRow): Builder {
  return {
    id: row.id,
    name: row.name,
    logoUrl: row.logo_url ?? undefined,
    description: row.description ?? undefined,
    createdAt: toMillis(row.created_at),
    ownerId: row.owner_id ?? undefined,
  };
}

export function rowToSeries(row: SeriesRow): Series {
  return {
    id: row.id,
    builderId: row.builder_id,
    name: row.name,
    description: row.description ?? undefined,
    thumbnailUrl: row.thumbnail_url ?? undefined,
    youtubeUrl: row.youtube_url ?? undefined,
    createdAt: toMillis(row.created_at),
  };
}

export function rowToHome(row: HomeRow): Home {
  return {
    id: row.id,
    seriesId: row.series_id ?? "",
    price: Number(row.price),
    bedrooms: row.bedrooms,
    bathrooms: Number(row.bathrooms),
    sqft: row.sqft,
    modelName: row.model_name ?? "",
    address: row.address ?? "",
    imageUrls: row.image_urls ?? [],
    description: row.description,
    youtubeUrl: row.youtube_url ?? "",
    status: row.status ?? "available",
    tags: row.tags ?? [],
    listingCategories: row.listing_categories ?? [],
    tagline: row.tagline ?? "",
    featuresOverview: row.features_overview ?? "",
    highlights: row.highlights ?? [],
    rooms: row.rooms ?? [],
    mediaGallery: row.media_gallery ?? [],
    reviews: row.reviews ?? [],
  };
}

export function rowToCommunity(row: CommunityRow, homes: Home[]): Community {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    description: row.description,
    thumbnailUrl: row.thumbnail_url,
    youtubeUrl: row.youtube_url,
    builderName: row.builder_name,
    builderId: row.builder_id ?? undefined,
    isMultiBuilder: row.is_multi_builder,
    builderIds: row.builder_ids ?? [],
    builderOffers: row.builder_offers,
    tags: row.tags ?? [],
    realtorName: row.realtor_name,
    realtorPhone: row.realtor_phone,
    realtorEmail: row.realtor_email,
    realtorPhotoUrl: row.realtor_photo_url,
    homes,
    createdAt: toMillis(row.created_at),
    amenities: row.amenities ?? [],
    lenders: row.lenders ?? [],
    mainHighlight: row.main_highlight ?? "",
    schoolDistrict: row.school_district ?? "",
    commuteNotes: row.commute_notes ?? "",
    hoaRange: row.hoa_range ?? "",
    offerExpires: row.offer_expires ?? "",
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    tagline: row.tagline ?? "",
    lifestyleNotes: row.lifestyle_notes ?? "",
    schoolOverview: row.school_overview ?? "",
    schools: row.schools ?? [],
    diningOverview: row.dining_overview ?? "",
    nearbyPlaces: row.nearby_places ?? [],
    reviews: row.reviews ?? [],
    mediaGallery: row.media_gallery ?? [],
    ownerId: row.owner_id ?? undefined,
    viewCount: row.view_count ?? 0,
    saveCount: row.save_count ?? 0,
  };
}

export function rowToLender(row: LenderRow): Lender {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url ?? undefined,
    order: row.sort_order,
    ownerId: row.owner_id ?? undefined,
  };
}

export function rowToLenderOffer(row: LenderOfferRow): LenderOffer {
  return {
    id: row.id,
    lenderId: row.lender_id,
    communityId: row.community_id ?? "",
    title: row.title,
    rate: row.rate ?? undefined,
    terms: row.terms ?? undefined,
    description: row.description,
    imageUrl: row.image_url ?? undefined,
    validUntil: row.valid_until ?? undefined,
    isActive: row.is_active,
  };
}

export function rowToFeatured(row: FeaturedItemRow): FeaturedItem {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    youtubeUrl: row.youtube_url,
    communityId: row.community_id ?? undefined,
    order: row.sort_order,
  };
}

export function rowToFeaturedCommunity(
  row: FeaturedCommunityRowRow,
): FeaturedCommunityRow {
  return { id: row.id, communityId: row.community_id, order: row.sort_order };
}

export function rowToHomepageSection(row: HomepageSectionRow): HomepageSection {
  return {
    id: row.id,
    sectionKey: row.section_key as HomepageSectionKey,
    title: row.title ?? undefined,
    enabled: row.enabled,
    order: row.sort_order,
  };
}

export function homepageSectionToRow(
  section: Pick<HomepageSection, "sectionKey" | "title" | "enabled" | "order">,
): Omit<HomepageSectionRow, "id"> {
  return {
    section_key: section.sectionKey,
    title: section.title?.trim() || null,
    enabled: section.enabled,
    sort_order: section.order,
  };
}

export function rowToTop10(row: Top10Row): Top10CommunitySlot {
  return {
    id: row.id,
    communityId: row.community_id,
    rank: row.rank,
    period: row.period,
    isAuto: row.is_auto,
  };
}

export function rowToHomepageSeries(
  row: HomepageSeriesRowRow,
): HomepageSeriesRow {
  return { id: row.id, seriesId: row.series_id, order: row.sort_order };
}

export function rowsToTagLabels(rows: TagLabelRow[]): Record<string, string> {
  return Object.fromEntries(rows.map((row) => [row.slug, row.label]));
}

// ---------------------------------------------------------------------
// TS input (camelCase) -> row (snake_case)
// Only includes keys that are present, so partial updates work.
// ---------------------------------------------------------------------

type AnyRow = Record<string, unknown>;

function setIfDefined(row: AnyRow, key: string, value: unknown): void {
  if (value !== undefined) row[key] = value;
}

export function builderInputToRow(data: Partial<BuilderInput>): AnyRow {
  const row: AnyRow = {};
  setIfDefined(row, "name", data.name);
  if ("logoUrl" in data) row.logo_url = data.logoUrl ?? null;
  if ("description" in data) row.description = data.description ?? null;
  return row;
}

export function seriesInputToRow(data: Partial<SeriesInput>): AnyRow {
  const row: AnyRow = {};
  setIfDefined(row, "builder_id", data.builderId);
  setIfDefined(row, "name", data.name);
  if ("description" in data) row.description = data.description ?? null;
  if ("thumbnailUrl" in data) row.thumbnail_url = data.thumbnailUrl ?? null;
  if ("youtubeUrl" in data) row.youtube_url = data.youtubeUrl ?? null;
  return row;
}

export function communityInputToRow(data: Partial<CommunityInput>): AnyRow {
  const row: AnyRow = {};
  setIfDefined(row, "name", data.name);
  setIfDefined(row, "city", data.city);
  setIfDefined(row, "description", data.description);
  setIfDefined(row, "thumbnail_url", data.thumbnailUrl);
  setIfDefined(row, "youtube_url", data.youtubeUrl);
  setIfDefined(row, "builder_name", data.builderName);
  if ("builderId" in data) row.builder_id = data.builderId ?? null;
  setIfDefined(row, "is_multi_builder", data.isMultiBuilder);
  setIfDefined(row, "builder_ids", data.builderIds);
  setIfDefined(row, "builder_offers", data.builderOffers);
  setIfDefined(row, "tags", data.tags);
  setIfDefined(row, "realtor_name", data.realtorName);
  setIfDefined(row, "realtor_phone", data.realtorPhone);
  setIfDefined(row, "realtor_email", data.realtorEmail);
  setIfDefined(row, "realtor_photo_url", data.realtorPhotoUrl);
  setIfDefined(row, "amenities", data.amenities);
  setIfDefined(row, "lenders", data.lenders);
  setIfDefined(row, "main_highlight", data.mainHighlight);
  setIfDefined(row, "school_district", data.schoolDistrict);
  setIfDefined(row, "commute_notes", data.commuteNotes);
  setIfDefined(row, "hoa_range", data.hoaRange);
  setIfDefined(row, "offer_expires", data.offerExpires);
  if ("latitude" in data) row.latitude = data.latitude ?? null;
  if ("longitude" in data) row.longitude = data.longitude ?? null;
  setIfDefined(row, "tagline", data.tagline);
  setIfDefined(row, "lifestyle_notes", data.lifestyleNotes);
  setIfDefined(row, "school_overview", data.schoolOverview);
  setIfDefined(row, "schools", data.schools);
  setIfDefined(row, "dining_overview", data.diningOverview);
  setIfDefined(row, "nearby_places", data.nearbyPlaces);
  setIfDefined(row, "reviews", data.reviews);
  setIfDefined(row, "media_gallery", data.mediaGallery);
  return row;
}

export function homeInputToRow(data: Partial<HomeInput>): AnyRow {
  const row: AnyRow = {};
  if ("seriesId" in data) row.series_id = data.seriesId || null;
  setIfDefined(row, "price", data.price);
  setIfDefined(row, "bedrooms", data.bedrooms);
  setIfDefined(row, "bathrooms", data.bathrooms);
  setIfDefined(row, "sqft", data.sqft);
  setIfDefined(row, "model_name", data.modelName);
  setIfDefined(row, "address", data.address);
  setIfDefined(row, "image_urls", data.imageUrls);
  setIfDefined(row, "description", data.description);
  setIfDefined(row, "youtube_url", data.youtubeUrl);
  if ("status" in data) row.status = data.status ?? null;
  setIfDefined(row, "tags", data.tags);
  setIfDefined(row, "listing_categories", data.listingCategories);
  setIfDefined(row, "tagline", data.tagline);
  setIfDefined(row, "features_overview", data.featuresOverview);
  setIfDefined(row, "highlights", data.highlights);
  setIfDefined(row, "rooms", data.rooms);
  setIfDefined(row, "media_gallery", data.mediaGallery);
  setIfDefined(row, "reviews", data.reviews);
  return row;
}

export function lenderInputToRow(data: Partial<LenderInput>): AnyRow {
  const row: AnyRow = {};
  setIfDefined(row, "name", data.name);
  setIfDefined(row, "description", data.description);
  if ("imageUrl" in data) row.image_url = data.imageUrl?.trim() || null;
  return row;
}

export function lenderOfferInputToRow(
  data: Partial<LenderOfferInput>,
): AnyRow {
  const row: AnyRow = {};
  setIfDefined(row, "lender_id", data.lenderId);
  setIfDefined(row, "community_id", data.communityId);
  setIfDefined(row, "title", data.title);
  if ("rate" in data) row.rate = data.rate ?? null;
  if ("terms" in data) row.terms = data.terms ?? null;
  setIfDefined(row, "description", data.description);
  if ("imageUrl" in data) row.image_url = data.imageUrl ?? null;
  if ("validUntil" in data) row.valid_until = data.validUntil ?? null;
  if ("isActive" in data) row.is_active = data.isActive ?? true;
  return row;
}

export function featuredInputToRow(data: Partial<FeaturedItemInput>): AnyRow {
  const row: AnyRow = {};
  setIfDefined(row, "title", data.title);
  setIfDefined(row, "subtitle", data.subtitle);
  setIfDefined(row, "youtube_url", data.youtubeUrl);
  if ("communityId" in data) row.community_id = data.communityId ?? null;
  return row;
}

// ---------------------------------------------------------------------
// Full-entity -> row (for seed / one-shot import; preserves ids & dates)
// ---------------------------------------------------------------------

export function builderToRow(builder: Builder): AnyRow {
  return {
    id: builder.id,
    name: builder.name,
    logo_url: builder.logoUrl ?? null,
    description: builder.description ?? null,
    created_at: new Date(builder.createdAt).toISOString(),
  };
}

export function seriesToRow(series: Series): AnyRow {
  return {
    id: series.id,
    builder_id: series.builderId,
    name: series.name,
    description: series.description ?? null,
    thumbnail_url: series.thumbnailUrl ?? null,
    youtube_url: series.youtubeUrl ?? null,
    created_at: new Date(series.createdAt).toISOString(),
  };
}

export function communityToRow(community: Community): AnyRow {
  return {
    ...communityInputToRow(community),
    id: community.id,
    created_at: new Date(community.createdAt).toISOString(),
  };
}

export function homeToRow(home: Home, communityId: string): AnyRow {
  return {
    ...homeInputToRow(home),
    id: home.id,
    community_id: communityId,
  };
}

export function lenderToRow(lender: Lender): AnyRow {
  return {
    ...lenderInputToRow(lender),
    id: lender.id,
    sort_order: lender.order,
  };
}

export function featuredToRow(item: FeaturedItem): AnyRow {
  return {
    ...featuredInputToRow(item),
    id: item.id,
    sort_order: item.order,
  };
}

export function featuredCommunityToRow(row: FeaturedCommunityRow): AnyRow {
  return { id: row.id, community_id: row.communityId, sort_order: row.order };
}

export function top10ToRow(slot: Top10CommunitySlot): AnyRow {
  return {
    id: slot.id,
    community_id: slot.communityId,
    rank: slot.rank,
    period: slot.period ?? "all-time",
    is_auto: slot.isAuto ?? false,
  };
}

export function homepageSeriesToRow(row: HomepageSeriesRow): AnyRow {
  return { id: row.id, series_id: row.seriesId, sort_order: row.order };
}

export function tagLabelsToRows(
  labels: Record<string, string>,
): TagLabelRow[] {
  return Object.entries(labels).map(([slug, label]) => ({ slug, label }));
}
