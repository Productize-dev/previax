import { buildDefaultHomepageSections } from "./homepage-layout";
import type {
  AppData,
  Builder,
  Community,
  FeaturedCommunityRow,
  Home,
  HomepageHomesRow,
  HomepageSeriesRow,
  Series,
} from "./types";
import { pickExampleModelHomeImage } from "./model-home-images";
import { isYouTubeThumbnailUrl } from "./youtube";

type LegacyHome = Home & { imageUrl?: string; seriesId?: string };
type LegacyCommunity = Community & { homes?: LegacyHome[] };

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function migrateHome(home: LegacyHome): Home {
  const base = home.imageUrls?.length
    ? { ...home, status: home.status ?? "available" }
    : home.imageUrl
      ? (() => {
          const { imageUrl, ...rest } = home;
          return {
            ...rest,
            imageUrls: [imageUrl],
            status: home.status ?? "available",
          };
        })()
      : { ...home, imageUrls: home.imageUrls ?? [], status: home.status ?? "available" };

  return {
    ...base,
    seriesId: base.seriesId ?? "",
    tags: base.tags ?? [],
    listingCategories: base.listingCategories ?? [],
    modelName: base.modelName ?? "",
    address: base.address ?? "",
    youtubeUrl: base.youtubeUrl ?? "",
    tagline: base.tagline ?? "",
    featuresOverview: base.featuresOverview ?? "",
    highlights: base.highlights ?? [],
    rooms: base.rooms ?? [],
    mediaGallery: base.mediaGallery ?? [],
    reviews: base.reviews ?? [],
  };
}

export function migrateCommunity(community: LegacyCommunity): Community {
  return {
    ...community,
    builderId: community.builderId,
    tags: community.tags ?? [],
    realtorEmail: community.realtorEmail ?? "",
    amenities: community.amenities ?? [],
    lenders: community.lenders ?? [],
    mainHighlight: community.mainHighlight ?? "",
    schoolDistrict: community.schoolDistrict ?? "",
    commuteNotes: community.commuteNotes ?? "",
    hoaRange: community.hoaRange ?? "",
    offerExpires: community.offerExpires ?? "",
    tagline: community.tagline ?? "",
    lifestyleNotes: community.lifestyleNotes ?? "",
    schoolOverview: community.schoolOverview ?? "",
    schools: community.schools ?? [],
    diningOverview: community.diningOverview ?? "",
    nearbyPlaces: community.nearbyPlaces ?? [],
    reviews: community.reviews ?? [],
    mediaGallery: community.mediaGallery ?? [],
    isMultiBuilder: community.isMultiBuilder ?? false,
    builderIds:
      community.builderIds ??
      (community.builderId ? [community.builderId] : []),
    homes: (community.homes ?? []).map(migrateHome),
  };
}

export function migrateCommunities(data: LegacyCommunity[]): Community[] {
  return data.map(migrateCommunity);
}

function ensureBuilders(communities: Community[], existing: Builder[]): Builder[] {
  if (existing.length > 0) return existing;

  const uniqueNames = [
    ...new Set(communities.map((c) => c.builderName).filter(Boolean)),
  ];

  return uniqueNames.map((name, index) => ({
    id: `migrated-builder-${slugify(name)}`,
    name,
    createdAt: Date.now() - index * 1000,
  }));
}

function linkCommunitiesToBuilders(
  communities: Community[],
  builders: Builder[],
): Community[] {
  const byName = new Map(
    builders.map((builder) => [builder.name.toLowerCase(), builder.id]),
  );

  return communities.map((community) => ({
    ...community,
    builderId:
      community.builderId ??
      byName.get(community.builderName.toLowerCase()) ??
      builders[0]?.id,
  }));
}

function ensureSeries(
  communities: Community[],
  builders: Builder[],
  existing: Series[],
): Series[] {
  if (existing.length > 0) return existing;

  return communities.map((community) => ({
    id: `migrated-series-${community.id}`,
    builderId: community.builderId ?? builders[0]?.id ?? "unknown",
    name: `${community.name} Collection`,
    thumbnailUrl: community.thumbnailUrl,
    youtubeUrl: community.youtubeUrl,
    createdAt: community.createdAt,
  }));
}

function assignHomeSeries(
  communities: Community[],
  series: Series[],
): Community[] {
  const defaultSeriesByCommunity = new Map(
    communities.map((community) => {
      const match =
        series.find((item) => item.id === `migrated-series-${community.id}`) ??
        series.find((item) => item.builderId === community.builderId);
      return [community.id, match?.id ?? series[0]?.id ?? ""];
    }),
  );

  return communities.map((community) => ({
    ...community,
    homes: community.homes.map((home) => ({
      ...home,
      seriesId:
        home.seriesId ||
        defaultSeriesByCommunity.get(community.id) ||
        series[0]?.id ||
        "",
      tags: home.tags ?? [],
      listingCategories: home.listingCategories ?? [],
    })),
  }));
}

function migrateHomepageSeries(
  homepageHomes: HomepageHomesRow[],
  communities: Community[],
  series: Series[],
  existing: HomepageSeriesRow[],
): HomepageSeriesRow[] {
  if (existing.length > 0) return existing;

  if (homepageHomes.length > 0) {
    return homepageHomes
      .map((row) => {
        const community = communities.find((item) => item.id === row.communityId);
        const communitySeries =
          series.find((item) => item.id === `migrated-series-${community?.id}`) ??
          series.find((item) => item.builderId === community?.builderId);

        if (!communitySeries) return null;

        return {
          id: row.id,
          seriesId: communitySeries.id,
          order: row.order,
        };
      })
      .filter((row): row is HomepageSeriesRow => row !== null);
  }

  return series.slice(0, 3).map((item, index) => ({
    id: `migrated-hp-series-${index}`,
    seriesId: item.id,
    order: index,
  }));
}

type LegacyAppData = Partial<AppData> & {
  communities?: LegacyCommunity[];
  /** @deprecated Renamed to featuredCommunities */
  futureCommunities?: FeaturedCommunityRow[];
};

export function migrateAppData(raw: LegacyAppData): AppData {
  let communities = migrateCommunities(raw.communities ?? []);
  const featured = [...(raw.featured ?? [])].sort((a, b) => a.order - b.order);
  const homepageHomes = [...(raw.homepageHomes ?? [])].sort(
    (a, b) => a.order - b.order,
  );

  const builders = ensureBuilders(communities, raw.builders ?? []);
  communities = linkCommunitiesToBuilders(communities, builders);

  const series = ensureSeries(communities, builders, raw.series ?? []);
  communities = assignHomeSeries(communities, series);

  const homepageSeries = migrateHomepageSeries(
    homepageHomes,
    communities,
    series,
    raw.homepageSeries ?? [],
  ).sort((a, b) => a.order - b.order);

  return applyExampleModelHomeImages({
    communities,
    featured,
    lenders: [...(raw.lenders ?? [])].sort((a, b) => a.order - b.order),
    lenderOffers: raw.lenderOffers ?? [],
    featuredCommunities: [...(raw.featuredCommunities ?? raw.futureCommunities ?? [])].sort(
      (a, b) => a.order - b.order,
    ),
    top10Communities: [...(raw.top10Communities ?? [])].sort(
      (a, b) => a.rank - b.rank,
    ),
    customCommunityTagLabels: raw.customCommunityTagLabels ?? {},
    builders,
    series,
    homepageSeries,
    homepageHomes,
    homepageSections:
      raw.homepageSections ?? buildDefaultHomepageSections(),
  });
}

function homeNeedsExampleImage(home: Home, community: Community): boolean {
  const url = home.imageUrls[0]?.trim();
  if (!url) return true;
  if (isYouTubeThumbnailUrl(url)) return true;
  if (url === community.thumbnailUrl?.trim()) return true;
  return false;
}

export function applyExampleModelHomeImages(data: AppData): AppData {
  return {
    ...data,
    communities: data.communities.map((community) => ({
      ...community,
      homes: community.homes.map((home) => {
        if (!homeNeedsExampleImage(home, community)) return home;

        const seed = `${community.name}:${home.modelName ?? home.id}`;
        return {
          ...home,
          imageUrls: [pickExampleModelHomeImage(seed)],
        };
      }),
    })),
  };
}
