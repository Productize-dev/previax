import type { Community } from "./types";

export const BASE_COMMUNITY_TAG_LABELS: Record<string, string> = {
  "new-construction": "New Construction",
  gated: "Gated Community",
  "55-plus": "55+",
  luxury: "Luxury",
  "master-planned": "Master-Planned",
  "golf-course": "Golf Course",
};

const TAG_ALIASES: Record<string, string> = {
  "new construction": "new-construction",
  "gated community": "gated",
  "gated": "gated",
  "55+": "55-plus",
  "55 plus": "55-plus",
  luxury: "luxury",
  "master-planned": "master-planned",
  "master planned": "master-planned",
  "golf course": "golf-course",
  townhomes: "townhomes",
  townhome: "townhomes",
  coastal: "coastal",
};

function slugifyTag(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function titleCaseFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function normalizeCommunityTagLabel(
  label: string,
): { slug: string; displayLabel: string } {
  const trimmed = label.trim();
  const alias = TAG_ALIASES[trimmed.toLowerCase()];
  if (alias) {
    return {
      slug: alias,
      displayLabel: BASE_COMMUNITY_TAG_LABELS[alias] ?? titleCaseFromSlug(alias),
    };
  }

  const slug = slugifyTag(trimmed);
  return {
    slug,
    displayLabel: trimmed,
  };
}

export function parseCommunityTagsFromCsv(
  value: string,
  customLabels: Record<string, string> = {},
): { tags: string[]; newLabels: Record<string, string> } {
  const tags: string[] = [];
  const newLabels: Record<string, string> = {};

  for (const part of value.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const { slug, displayLabel } = normalizeCommunityTagLabel(trimmed);
    if (!slug) continue;

    tags.push(slug);

    const known =
      BASE_COMMUNITY_TAG_LABELS[slug] ??
      customLabels[slug] ??
      newLabels[slug];
    if (!known) {
      newLabels[slug] = displayLabel;
    }
  }

  return { tags: [...new Set(tags)], newLabels };
}

export function mergeCommunityTagLabels(
  ...maps: Array<Record<string, string> | undefined>
): Record<string, string> {
  return Object.assign({}, BASE_COMMUNITY_TAG_LABELS, ...maps);
}

export function getCommunityTagLabel(
  tag: string,
  customLabels: Record<string, string> = {},
): string {
  return (
    BASE_COMMUNITY_TAG_LABELS[tag] ??
    customLabels[tag] ??
    titleCaseFromSlug(tag)
  );
}

export function getAllCommunityTagOptions(
  communities: Community[],
  customLabels: Record<string, string> = {},
): string[] {
  const tags = new Set<string>([
    ...Object.keys(BASE_COMMUNITY_TAG_LABELS),
    ...Object.keys(customLabels),
    ...communities.flatMap((community) => community.tags ?? []),
  ]);

  return [...tags].sort((a, b) =>
    getCommunityTagLabel(a, customLabels).localeCompare(
      getCommunityTagLabel(b, customLabels),
    ),
  );
}
