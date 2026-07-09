import { DEFAULT_COMMUNITY_FIELDS } from "@/lib/dashboard-defaults";
import { MAIN_HIGHLIGHT_MAX_LENGTH } from "@/lib/community-detail";
import { parseCommunityTagsFromCsv } from "@/lib/community-tag-registry";
import {
  applyColumnMapping,
  type CommunityColumnMapping,
  COMMUNITY_CSV_FIELDS,
  type CsvImportMode,
  type CsvImportPreview,
  type CsvRowPreview,
  type HomeColumnMapping,
  HOME_CSV_FIELDS,
} from "@/lib/csv-import-schema";
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

export type CsvImportOptions = {
  mode?: CsvImportMode;
  communityMapping?: CommunityColumnMapping;
  homeMapping?: HomeColumnMapping;
  skipErrorRows?: boolean;
};

export type CsvImportResult = {
  data: AppData;
  communitiesAdded: number;
  communitiesUpdated: number;
  homesAdded: number;
  homesUpdated: number;
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

export function communityKey(name: string, city: string): string {
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
  existingId?: string,
): Community {
  const id = existingId ?? `import-community-${slugify(input.name)}`;
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
  existingHome?: Home,
): HomeInput {
  const youtubeUrl = row.youtube_url?.trim();
  const modelName = row.name?.trim() ?? "";
  const imageUrls =
    existingHome?.imageUrls?.length
      ? existingHome.imageUrls
      : [pickExampleModelHomeImage(`${community.name}:${modelName}`)].filter(
          Boolean,
        );

  return {
    seriesId,
    price: Number(row.price) || existingHome?.price || 0,
    bedrooms: Number(row.bedrooms) || existingHome?.bedrooms || 0,
    bathrooms: Number(row.bathrooms) || existingHome?.bathrooms || 0,
    sqft: Number(row.sqft) || existingHome?.sqft || 0,
    imageUrls,
    modelName,
    description: row.description?.trim() ?? "",
    youtubeUrl: youtubeUrl && isValidYouTubeUrl(youtubeUrl) ? youtubeUrl : undefined,
    address: existingHome?.address ?? "",
    status: existingHome?.status ?? "available",
    tags: existingHome?.tags ?? ["move-in-ready"],
    listingCategories: existingHome?.listingCategories ?? [],
    tagline: existingHome?.tagline ?? "",
    featuresOverview: existingHome?.featuresOverview ?? "",
    highlights: existingHome?.highlights ?? [],
    rooms: existingHome?.rooms ?? [],
    mediaGallery: existingHome?.mediaGallery ?? [],
    reviews: existingHome?.reviews ?? [],
  };
}

function validateCommunityRow(
  row: Record<string, string>,
  rowNumber: number,
  existingKeys: Map<string, Community>,
  mode: CsvImportMode,
): CsvRowPreview {
  const errors: string[] = [];
  const warnings: string[] = [];
  const name = row.community_name?.trim();
  const builderName = row.builder?.trim();
  const city = parseCity(row.city ?? "");

  if (!name) errors.push("Missing community_name");
  if (!builderName) errors.push("Missing builder");
  if (!row.city?.trim()) errors.push("Missing city");
  if (!row.description?.trim()) warnings.push("Missing description");

  const key = name && city ? communityKey(name, city) : "";
  const existing = key ? existingKeys.get(key) : undefined;

  let status: CsvRowPreview["status"] = "create";
  if (errors.length > 0) status = "error";
  else if (existing) {
    status = mode === "upsert" ? "update" : "skip";
    if (mode === "create") warnings.push("Duplicate — will skip");
  }

  return {
    rowNumber,
    status,
    errors,
    warnings,
    label: name ? `${name} — ${city}` : `Row ${rowNumber}`,
    raw: row,
  };
}

function validateHomeRow(
  row: Record<string, string>,
  rowNumber: number,
  communityNames: Set<string>,
): CsvRowPreview {
  const errors: string[] = [];
  const warnings: string[] = [];
  const community = row.community?.trim();
  const name = row.name?.trim();

  if (!community) errors.push("Missing community");
  else if (!communityNames.has(community)) {
    warnings.push(`Community "${community}" not in communities file`);
  }
  if (!name) errors.push("Missing model name");

  return {
    rowNumber,
    status: errors.length > 0 ? "error" : "create",
    errors,
    warnings,
    label: name ? `${community}: ${name}` : `Row ${rowNumber}`,
    raw: row,
  };
}

export function previewCsvImport(
  data: AppData,
  communitiesCsv: string,
  modelHomesCsv: string,
  options: CsvImportOptions = {},
): CsvImportPreview {
  const mode = options.mode ?? "create";
  const communityRows = parseCsvRecords(communitiesCsv).map((row) =>
    applyColumnMapping(row, options.communityMapping, COMMUNITY_CSV_FIELDS),
  );
  const homeRows = parseCsvRecords(modelHomesCsv).map((row) =>
    applyColumnMapping(row, options.homeMapping, HOME_CSV_FIELDS),
  );

  const existingByKey = new Map(
    data.communities.map((c) => [communityKey(c.name, c.city), c]),
  );
  const communityNames = new Set(
    communityRows.map((r) => r.community_name?.trim()).filter(Boolean),
  );

  const communities = communityRows.map((row, index) =>
    validateCommunityRow(row, index + 2, existingByKey, mode),
  );
  const homes = homeRows.map((row, index) =>
    validateHomeRow(row, index + 2, communityNames),
  );

  const count = (rows: CsvRowPreview[], status: CsvRowPreview["status"]) =>
    rows.filter((r) => r.status === status).length;

  return {
    communities,
    homes,
    summary: {
      communitiesCreate: count(communities, "create"),
      communitiesUpdate: count(communities, "update"),
      communitiesSkip: count(communities, "skip"),
      communitiesError: count(communities, "error"),
      homesCreate: count(homes, "create"),
      homesUpdate: count(homes, "update"),
      homesSkip: count(homes, "skip"),
      homesError: count(homes, "error"),
    },
  };
}

export function importCatalogFromCsv(
  data: AppData,
  communitiesCsv: string,
  modelHomesCsv: string,
  options: CsvImportOptions = {},
): CsvImportResult {
  const mode = options.mode ?? "create";
  const skipErrorRows = options.skipErrorRows ?? true;
  const preview = previewCsvImport(
    data,
    communitiesCsv,
    modelHomesCsv,
    options,
  );

  const communityRows = parseCsvRecords(communitiesCsv).map((row) =>
    applyColumnMapping(row, options.communityMapping, COMMUNITY_CSV_FIELDS),
  );
  const homeRows = parseCsvRecords(modelHomesCsv).map((row) =>
    applyColumnMapping(row, options.homeMapping, HOME_CSV_FIELDS),
  );

  let builders = [...data.builders];
  let series = [...data.series];
  let communities = [...data.communities];
  const customCommunityTagLabels = { ...(data.customCommunityTagLabels ?? {}) };

  const existingByKey = new Map(
    communities.map((community) => [
      communityKey(community.name, community.city),
      community,
    ]),
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
  let communitiesUpdated = 0;
  let homesAdded = 0;
  let homesUpdated = 0;
  let buildersAdded = 0;
  const tagsAdded = new Set<string>();

  communityRows.forEach((row, index) => {
    const rowPreview = preview.communities[index];
    if (!rowPreview) return;
    if (rowPreview.status === "error" && skipErrorRows) return;
    if (rowPreview.status === "skip") return;

    const name = row.community_name?.trim();
    const builderName = row.builder?.trim();
    if (!name || !builderName) return;

    const city = parseCity(row.city ?? "");
    const key = communityKey(name, city);
    const existing = existingByKey.get(key);

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

    const homeRowsForCommunity = homesByCommunity.get(name) ?? [];
    const seriesResult = findOrCreateSeries(
      series,
      builderResult.builder,
      {
        id: existing?.id ?? `import-community-${slugify(name)}`,
        name,
        thumbnailUrl: input.thumbnailUrl,
        youtubeUrl: input.youtubeUrl,
      },
    );
    series = seriesResult.series;

    if (existing && mode === "upsert") {
      const updatedHomes = [...existing.homes];
      for (const homeRow of homeRowsForCommunity) {
        const modelName = homeRow.name?.trim() ?? "";
        const homeIndex = updatedHomes.findIndex(
          (h) => (h.modelName ?? "").toLowerCase() === modelName.toLowerCase(),
        );
        const homeInput = buildHomeFromRow(
          homeRow,
          seriesResult.item.id,
          existing,
          homeIndex >= 0 ? updatedHomes[homeIndex] : undefined,
        );
        if (homeIndex >= 0) {
          updatedHomes[homeIndex] = {
            ...updatedHomes[homeIndex],
            ...homeInput,
            id: updatedHomes[homeIndex].id,
          };
          homesUpdated++;
        } else {
          updatedHomes.push({
            ...homeInput,
            id: `${existing.id}-home-${slugify(modelName)}-${updatedHomes.length}`,
          });
          homesAdded++;
        }
      }

      const updated: Community = {
        ...existing,
        ...input,
        id: existing.id,
        createdAt: existing.createdAt,
        homes: updatedHomes,
      };
      communities = communities.map((c) => (c.id === existing.id ? updated : c));
      existingByKey.set(key, updated);
      communitiesUpdated++;
      return;
    }

    if (existing) return;

    const community = createCommunity(input, []);
    community.homes = homeRowsForCommunity.map((homeRow, homeIndex) => {
      const homeInput = buildHomeFromRow(
        homeRow,
        seriesResult.item.id,
        community,
      );
      return {
        ...homeInput,
        id: `${community.id}-home-${homeIndex}`,
      };
    });
    homesAdded += community.homes.length;

    communities.push(community);
    existingByKey.set(key, community);
    communitiesAdded++;
  });

  return {
    data: {
      ...data,
      builders,
      series,
      communities,
      customCommunityTagLabels,
    },
    communitiesAdded,
    communitiesUpdated,
    homesAdded,
    homesUpdated,
    buildersAdded,
    tagsAdded: [...tagsAdded],
  };
}
