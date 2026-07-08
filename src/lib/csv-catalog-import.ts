import { DEFAULT_COMMUNITY_FIELDS } from "@/lib/dashboard-defaults";
import { MAIN_HIGHLIGHT_MAX_LENGTH } from "@/lib/community-detail";
import { parseCommunityTagsFromCsv } from "@/lib/community-tag-registry";
import { parseCsvRecords, splitCsvList } from "@/lib/csv-parse";
import { pickExampleModelHomeImage } from "@/lib/model-home-images";
import {
  getYouTubeThumbnailUrl,
  isValidYouTubeUrl,
  resolveThumbnailFromYouTube,
} from "@/lib/youtube";
import type {
  AppData,
  Builder,
  Community,
  CommunityInput,
  Home,
  HomeInput,
  Series,
} from "@/lib/types";

export const DEFAULT_PRESENTATION_YOUTUBE_URL =
  "https://www.youtube.com/watch?v=rObOyU4SXuw";

const PLACEHOLDER_THUMBNAIL =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80";

export type CsvImportResult = {
  data: AppData;
  communitiesAdded: number;
  homesAdded: number;
  buildersAdded: number;
  tagsAdded: string[];
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseCity(value: string): string {
  const trimmed = value.trim();
  const [city] = trimmed.split(",");
  return city.trim() || trimmed;
}

function truncateHighlight(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= MAIN_HIGHLIGHT_MAX_LENGTH) return trimmed;
  return `${trimmed.slice(0, MAIN_HIGHLIGHT_MAX_LENGTH - 1).trimEnd()}…`;
}

function communityKey(name: string, city: string): string {
  return `${name.trim().toLowerCase()}|${city.trim().toLowerCase()}`;
}

function resolveYoutubeUrl(url: string): string {
  const trimmed = url.trim();
  if (trimmed && isValidYouTubeUrl(trimmed)) return trimmed;
  return DEFAULT_PRESENTATION_YOUTUBE_URL;
}

function resolveThumbnail(youtubeUrl: string): string {
  return (
    resolveThumbnailFromYouTube(youtubeUrl) ||
    getYouTubeThumbnailUrl(youtubeUrl) ||
    PLACEHOLDER_THUMBNAIL
  );
}

function findOrCreateBuilder(
  builders: Builder[],
  name: string,
): { builders: Builder[]; builder: Builder; created: boolean } {
  const existing = builders.find(
    (builder) => builder.name.toLowerCase() === name.toLowerCase(),
  );
  if (existing) {
    return { builders, builder: existing, created: false };
  }

  const builder: Builder = {
    id: `import-builder-${slugify(name)}`,
    name: name.trim(),
    createdAt: Date.now(),
  };

  return {
    builders: [...builders, builder],
    builder,
    created: true,
  };
}

function findOrCreateSeries(
  series: Series[],
  builder: Builder,
  community: Pick<Community, "id" | "name" | "thumbnailUrl" | "youtubeUrl">,
): { series: Series[]; item: Series; created: boolean } {
  const existing =
    series.find((item) => item.id === `import-series-${community.id}`) ??
    series.find(
      (item) =>
        item.builderId === builder.id &&
        item.name.toLowerCase() === `${community.name} Collection`.toLowerCase(),
    );

  if (existing) {
    return { series, item: existing, created: false };
  }

  const item: Series = {
    id: `import-series-${community.id}`,
    builderId: builder.id,
    name: `${community.name} Collection`,
    thumbnailUrl: community.thumbnailUrl,
    youtubeUrl: community.youtubeUrl,
    createdAt: Date.now(),
  };

  return {
    series: [...series, item],
    item,
    created: true,
  };
}

function buildCommunityFromRow(
  row: Record<string, string>,
  builder: Builder,
  customLabels: Record<string, string>,
): {
  input: CommunityInput;
  tagLabels: Record<string, string>;
} {
  const { tags, newLabels } = parseCommunityTagsFromCsv(
    row.tags ?? "",
    customLabels,
  );
  const youtubeUrl = resolveYoutubeUrl(row.youtube_url ?? "");

  const input: CommunityInput = {
    ...DEFAULT_COMMUNITY_FIELDS,
    name: row.community_name?.trim() ?? "",
    city: parseCity(row.city ?? ""),
    description: row.description?.trim() ?? "",
    mainHighlight: truncateHighlight(row.main_highlight ?? ""),
    thumbnailUrl: resolveThumbnail(youtubeUrl),
    youtubeUrl,
    builderName: builder.name,
    builderId: builder.id,
    builderIds: [builder.id],
    isMultiBuilder: false,
    amenities: splitCsvList(row.amenities ?? ""),
    lenders: splitCsvList(row.lenders ?? ""),
    tags,
  };

  return { input, tagLabels: newLabels };
}

function createCommunity(
  input: CommunityInput,
  homes: HomeInput[],
): Community {
  const id = `import-community-${slugify(input.name)}`;
  const createdAt = Date.now();

  return {
    ...input,
    id,
    createdAt,
    homes: homes.map((home, index) => ({
      ...home,
      id: `${id}-home-${slugify(home.modelName ?? home.description)}-${index}`,
    })),
  };
}

function buildHomeFromRow(
  row: Record<string, string>,
  seriesId: string,
  community: Community,
): HomeInput {
  const youtubeUrl = row.youtube_url?.trim();
  const modelName = row.name?.trim() ?? "";
  const imageUrls = [
    pickExampleModelHomeImage(`${community.name}:${modelName}`),
  ].filter(Boolean);

  return {
    seriesId,
    price: 0,
    bedrooms: 0,
    bathrooms: 0,
    sqft: 0,
    imageUrls,
    modelName,
    description: row.description?.trim() ?? "",
    youtubeUrl: youtubeUrl && isValidYouTubeUrl(youtubeUrl) ? youtubeUrl : undefined,
    address: "",
    status: "available",
    tags: ["move-in-ready"],
    listingCategories: [],
    tagline: "",
    featuresOverview: "",
    highlights: [],
    rooms: [],
    mediaGallery: [],
    reviews: [],
  };
}

export function importCatalogFromCsv(
  data: AppData,
  communitiesCsv: string,
  modelHomesCsv: string,
): CsvImportResult {
  const communityRows = parseCsvRecords(communitiesCsv);
  const homeRows = parseCsvRecords(modelHomesCsv);

  let builders = [...data.builders];
  let series = [...data.series];
  let communities = [...data.communities];
  const customCommunityTagLabels = { ...(data.customCommunityTagLabels ?? {}) };

  const existingKeys = new Set(
    communities.map((community) =>
      communityKey(community.name, community.city),
    ),
  );

  const homesByCommunity = new Map<string, Record<string, string>[]>();
  for (const row of homeRows) {
    const key = row.community?.trim();
    if (!key) continue;
    const list = homesByCommunity.get(key) ?? [];
    list.push(row);
    homesByCommunity.set(key, list);
  }

  let communitiesAdded = 0;
  let homesAdded = 0;
  let buildersAdded = 0;
  const tagsAdded = new Set<string>();

  for (const row of communityRows) {
    const name = row.community_name?.trim();
    const builderName = row.builder?.trim();
    if (!name || !builderName) continue;

    const city = parseCity(row.city ?? "");
    const key = communityKey(name, city);
    if (existingKeys.has(key)) continue;

    const builderResult = findOrCreateBuilder(builders, builderName);
    builders = builderResult.builders;
    if (builderResult.created) buildersAdded++;

    const { input, tagLabels } = buildCommunityFromRow(
      row,
      builderResult.builder,
      customCommunityTagLabels,
    );

    Object.assign(customCommunityTagLabels, tagLabels);
    Object.keys(tagLabels).forEach((tag) => tagsAdded.add(tag));

    const community = createCommunity(input, []);
    const seriesResult = findOrCreateSeries(series, builderResult.builder, community);
    series = seriesResult.series;

    const homeInputs = (homesByCommunity.get(name) ?? []).map((homeRow) =>
      buildHomeFromRow(homeRow, seriesResult.item.id, community),
    );

    community.homes = homeInputs.map((home, index) => ({
      ...home,
      id: `${community.id}-home-${index}`,
    }));
    homesAdded += community.homes.length;

    communities.push(community);
    existingKeys.add(key);
    communitiesAdded++;
  }

  return {
    data: {
      ...data,
      builders,
      series,
      communities,
      customCommunityTagLabels,
    },
    communitiesAdded,
    homesAdded,
    buildersAdded,
    tagsAdded: [...tagsAdded],
  };
}
