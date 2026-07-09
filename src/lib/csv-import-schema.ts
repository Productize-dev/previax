/** Canonical CSV column names for catalog import. */
export const COMMUNITY_CSV_FIELDS = [
  "builder",
  "community_name",
  "city",
  "description",
  "main_highlight",
  "amenities",
  "lenders",
  "tags",
  "youtube_url",
] as const;

export const HOME_CSV_FIELDS = [
  "community",
  "name",
  "description",
  "youtube_url",
  "price",
  "bedrooms",
  "bathrooms",
  "sqft",
] as const;

export type CommunityCsvField = (typeof COMMUNITY_CSV_FIELDS)[number];
export type HomeCsvField = (typeof HOME_CSV_FIELDS)[number];

/** Maps canonical field → header name in the uploaded file. */
export type CommunityColumnMapping = Partial<Record<CommunityCsvField, string>>;
export type HomeColumnMapping = Partial<Record<HomeCsvField, string>>;

export type CsvImportMode = "create" | "upsert";

export type CsvRowStatus = "create" | "update" | "skip" | "error";

export type CsvRowPreview = {
  rowNumber: number;
  status: CsvRowStatus;
  errors: string[];
  warnings: string[];
  label: string;
  raw: Record<string, string>;
};

export type CsvImportPreview = {
  communities: CsvRowPreview[];
  homes: CsvRowPreview[];
  summary: {
    communitiesCreate: number;
    communitiesUpdate: number;
    communitiesSkip: number;
    communitiesError: number;
    homesCreate: number;
    homesUpdate: number;
    homesSkip: number;
    homesError: number;
  };
};

export function guessColumnMapping(
  headers: string[],
  canonicalFields: readonly string[],
): Partial<Record<string, string>> {
  const mapping: Partial<Record<string, string>> = {};
  const normalized = headers.map((h) => ({
    original: h,
    key: h.trim().toLowerCase().replace(/\s+/g, "_"),
  }));

  for (const field of canonicalFields) {
    const exact = normalized.find((h) => h.key === field);
    if (exact) {
      mapping[field] = exact.original;
      continue;
    }
    const aliases: Record<string, string[]> = {
      community_name: ["community", "community name", "name"],
      builder: ["builder_name", "builder name"],
      main_highlight: ["highlight", "main highlight"],
      youtube_url: ["youtube", "video_url", "video"],
    };
    const candidates = aliases[field] ?? [];
    const match = normalized.find((h) =>
      candidates.some((a) => h.key === a.replace(/\s+/g, "_")),
    );
    if (match) mapping[field] = match.original;
  }

  return mapping;
}

export function applyColumnMapping(
  row: Record<string, string>,
  mapping: Partial<Record<string, string>> | undefined,
  canonicalFields: readonly string[],
): Record<string, string> {
  if (!mapping || Object.keys(mapping).length === 0) return row;

  const mapped: Record<string, string> = {};
  for (const field of canonicalFields) {
    const sourceHeader = mapping[field];
    if (sourceHeader && row[sourceHeader] !== undefined) {
      mapped[field] = row[sourceHeader];
    } else if (row[field] !== undefined) {
      mapped[field] = row[field];
    }
  }
  return mapped;
}

export function getCsvHeaders(text: string): string[] {
  const firstLine = text.trim().split(/\r?\n/)[0] ?? "";
  if (!firstLine) return [];
  return firstLine.split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
}
