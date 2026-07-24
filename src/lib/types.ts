export type HomeStatus = "available" | "coming-soon" | "sold";

export type CommunityTag = string;

export type HomeTag =
  | "move-in-ready"
  | "under-construction"
  | "custom-build"
  | "patio-home"
  | "single-story"
  | "basement";

/** Promotional badges shown on homepage home rows (Netflix-style). */
export type HomeListingCategory =
  | "zero-down"
  | "one-level"
  | "master-on-main-3-beds"
  | "big-incentives"
  | "top-ten";

/** Publishing pipeline for sales-submitted communities. */
export type CommunityPipelineStatus =
  | "draft"
  | "awaiting_video"
  | "video_review"
  | "pending_admin"
  | "pending_builder"
  | "live"
  | "rejected";

export type Builder = {
  id: string;
  name: string;
  logoUrl?: string;
  description?: string;
  createdAt: number;
  /** Dashboard scope — quién gestiona este builder en Supabase. */
  ownerId?: string;
};

export type Series = {
  id: string;
  builderId: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  youtubeUrl?: string;
  createdAt: number;
};

export type SchoolInfo = {
  id: string;
  name: string;
  type: "elementary" | "middle" | "high" | "private" | "other";
  rating?: string;
  distance?: string;
  notes?: string;
};

export type NearbyPlaceCategory =
  | "restaurant"
  | "cafe"
  | "grocery"
  | "entertainment"
  | "park"
  | "other";

export type NearbyPlace = {
  id: string;
  name: string;
  category: NearbyPlaceCategory;
  cuisine?: string;
  distance?: string;
  description?: string;
  imageUrl?: string;
};

export type CommunityReview = {
  id: string;
  author: string;
  rating: number;
  quote: string;
  date?: string;
  avatarUrl?: string;
};

export type MediaItem = {
  id: string;
  type: "image" | "youtube";
  url: string;
  caption?: string;
};

export type HomeReview = {
  id: string;
  author: string;
  rating: number;
  quote: string;
  date?: string;
  avatarUrl?: string;
};

export type HomeRoom = {
  id: string;
  name: string;
  size?: string;
  notes?: string;
  imageUrl?: string;
};

export type Home = {
  id: string;
  seriesId: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  modelName?: string;
  address?: string;
  imageUrls: string[];
  description: string;
  youtubeUrl?: string;
  status?: HomeStatus;
  tags?: HomeTag[];
  listingCategories?: HomeListingCategory[];
  tagline?: string;
  featuresOverview?: string;
  highlights?: string[];
  rooms?: HomeRoom[];
  mediaGallery?: MediaItem[];
  reviews?: HomeReview[];
};

export type Community = {
  id: string;
  name: string;
  city: string;
  description: string;
  thumbnailUrl: string;
  youtubeUrl: string;
  builderName: string;
  builderId?: string;
  /** When true, community is associated with multiple builders. */
  isMultiBuilder?: boolean;
  builderIds?: string[];
  builderOffers: string;
  tags?: CommunityTag[];
  realtorName: string;
  realtorPhone: string;
  realtorEmail: string;
  realtorPhotoUrl: string;
  homes: Home[];
  createdAt: number;
  amenities?: string[];
  lenders?: string[];
  mainHighlight?: string;
  schoolDistrict?: string;
  commuteNotes?: string;
  hoaRange?: string;
  offerExpires?: string;
  latitude?: number;
  longitude?: number;
  tagline?: string;
  lifestyleNotes?: string;
  schoolOverview?: string;
  schools?: SchoolInfo[];
  diningOverview?: string;
  nearbyPlaces?: NearbyPlace[];
  reviews?: CommunityReview[];
  mediaGallery?: MediaItem[];
  /** Dashboard scope — dueño de la comunidad en Supabase. */
  ownerId?: string;
  viewCount?: number;
  saveCount?: number;
  /** When true, community is hidden from the public site. */
  isHidden?: boolean;
  /** Sales publishing workflow status. Defaults to live for legacy rows. */
  pipelineStatus?: CommunityPipelineStatus;
  submittedBy?: string;
  step1CompletedAt?: number;
  step2SubmittedAt?: number;
  adminApprovedAt?: number;
  adminApprovedBy?: string;
  builderApprovedAt?: number;
  builderDeadlineAt?: number;
  rejectedAt?: number;
  rejectionReason?: string;
};

export type FeaturedItem = {
  id: string;
  title: string;
  subtitle: string;
  youtubeUrl: string;
  communityId?: string;
  order: number;
};

export type CommunityInput = Omit<Community, "id" | "createdAt" | "homes">;

export type HomeInput = Omit<Home, "id">;

export type FeaturedItemInput = Omit<FeaturedItem, "id" | "order">;

export type Lender = {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  order: number;
  /** Dashboard scope — quién gestiona este lender en Supabase. */
  ownerId?: string;
};

export type LenderOffer = {
  id: string;
  lenderId: string;
  communityId: string;
  title: string;
  rate?: string;
  terms?: string;
  description: string;
  imageUrl?: string;
  validUntil?: string;
  isActive: boolean;
};

export type LenderOfferInput = Omit<LenderOffer, "id" | "isActive"> & {
  isActive?: boolean;
};

export type LenderInput = Omit<Lender, "id" | "order">;

/** Curated communities shown in the homepage "Featured Communities" row. */
export type FeaturedCommunityRow = {
  id: string;
  communityId: string;
  order: number;
};

/** Periodo del ranking Top 10 (badge en detalle de comunidad). */
export type Top10Period = "all-time" | "week" | "month";

/** Ranked slot (1–10) for the community detail Top 10 badge. */
export type Top10CommunitySlot = {
  id: string;
  communityId: string;
  rank: number;
  period?: Top10Period;
  /** false = override manual del admin; true = calculado automáticamente. */
  isAuto?: boolean;
};

/** Evento de actividad para el feed del admin. */
export type ActivityEvent = {
  id: string;
  type: string;
  entityId: string;
  actorId?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

/** @deprecated Use FeaturedCommunityRow */
export type FutureCommunityRow = FeaturedCommunityRow;

/** @deprecated Use homepageSeries */
export type HomepageHomesRow = {
  id: string;
  communityId: string;
  order: number;
};

export type HomepageSeriesRow = {
  id: string;
  seriesId: string;
  order: number;
};

/** Configurable homepage browse section (order, visibility, title). */
export type HomepageSectionKey =
  | "hero"
  | "personalized"
  | "my-list"
  | "saved-homes"
  | "liked-communities"
  | "liked-homes"
  | "trending"
  | "featured-communities"
  | "top-10"
  | "listing-categories"
  | "main-highlights"
  | "community-tags"
  | "home-tags"
  | "lenders"
  | "cities"
  | "all-communities"
  | "custom-videos";

/** Video tile inside a custom homepage video row (e.g. By Previax). */
export type HomepageSectionVideo = {
  id: string;
  sectionId: string;
  title: string;
  youtubeUrl: string;
  thumbnailUrl?: string;
  order: number;
};

export type HomepageSectionVideoInput = Omit<
  HomepageSectionVideo,
  "id" | "sectionId" | "order"
>;

/**
 * Per-section options. For auto-generated rows (tags, cities, categories),
 * `includeKeys` selects which sub-rows appear (and in what order).
 * `null` / omitted = show all available.
 */
export type HomepageSectionConfig = {
  includeKeys?: string[] | null;
};

export type HomepageSection = {
  id: string;
  sectionKey: HomepageSectionKey;
  /** Optional display title override on the homepage. */
  title?: string;
  enabled: boolean;
  order: number;
  config?: HomepageSectionConfig;
  /** Populated for custom-videos sections. */
  videos?: HomepageSectionVideo[];
};

export type BuilderInput = Omit<Builder, "id" | "createdAt">;

export type SeriesInput = Omit<Series, "id" | "createdAt">;

export type AppData = {
  communities: Community[];
  featured: FeaturedItem[];
  lenders: Lender[];
  lenderOffers: LenderOffer[];
  featuredCommunities: FeaturedCommunityRow[];
  top10Communities: Top10CommunitySlot[];
  /** Display labels for CSV-imported or custom community tags. */
  customCommunityTagLabels?: Record<string, string>;
  builders: Builder[];
  series: Series[];
  homepageSeries: HomepageSeriesRow[];
  /** @deprecated Use homepageSeries */
  homepageHomes: HomepageHomesRow[];
  homepageSections: HomepageSection[];
};

export type DashboardTab =
  | "overview"
  | "assistant"
  | "builders"
  | "communities"
  | "pipeline"
  | "sales-team"
  | "lenders"
  | "featured"
  | "featured-communities"
  | "top-10"
  | "homepage-layout";

export type BuyerProfile = {
  name: string;
  email: string;
};

export type UserRole = "buyer" | "builder" | "lender" | "admin" | "sales";

export type UserStatus = "active" | "pending" | "rejected";

export type AppNotification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  communityId?: string;
  href?: string;
  readAt?: number;
  createdAt: number;
};

/** Fila de public.profiles mapeada a camelCase. */
export type Profile = {
  id: string;
  role: UserRole;
  status: UserStatus;
  fullName?: string;
  companyName?: string;
  email?: string;
  avatarUrl?: string;
};

export type GuidanceFormData = {
  email: string;
  budget: string;
  cities: string;
  timeline: string;
  notes?: string;
};
