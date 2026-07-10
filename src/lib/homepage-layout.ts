import { sortTop10Slots } from "@/lib/top-10-communities";
import type {
  Community,
  HomepageSection,
  HomepageSectionKey,
  Top10CommunitySlot,
} from "@/lib/types";

export type HomepageSectionCatalogEntry = {
  key: HomepageSectionKey;
  defaultTitle: string;
  description: string;
  /** Dashboard tab to curate this section's content, if any. */
  manageTab?: "featured" | "featured-communities" | "top-10" | "lenders";
};

export const HOMEPAGE_SECTION_CATALOG: HomepageSectionCatalogEntry[] = [
  {
    key: "hero",
    defaultTitle: "Hero carousel",
    description: "Featured video slides at the top of the homepage.",
    manageTab: "featured",
  },
  {
    key: "personalized",
    defaultTitle: "For you",
    description: "AI-personalized community rows based on buyer activity.",
  },
  {
    key: "my-list",
    defaultTitle: "My List",
    description: "Communities the buyer saved (heart icon).",
  },
  {
    key: "saved-homes",
    defaultTitle: "Saved Homes",
    description: "Individual home models the buyer saved.",
  },
  {
    key: "liked-communities",
    defaultTitle: "Liked Communities",
    description: "Communities the buyer liked (thumbs up).",
  },
  {
    key: "liked-homes",
    defaultTitle: "Liked Homes",
    description: "Home models the buyer liked.",
  },
  {
    key: "trending",
    defaultTitle: "Trending Now",
    description: "Newest communities by date added.",
  },
  {
    key: "featured-communities",
    defaultTitle: "Featured Communities",
    description: "Admin-curated community row.",
    manageTab: "featured-communities",
  },
  {
    key: "top-10",
    defaultTitle: "Top 10 Communities",
    description: "Ranked communities from the Top 10 manager.",
    manageTab: "top-10",
  },
  {
    key: "listing-categories",
    defaultTitle: "Homes by category",
    description:
      "Rows grouped by listing badges (Top 10, zero down, incentives, etc.).",
  },
  {
    key: "main-highlights",
    defaultTitle: "Homes by highlight",
    description: "Rows grouped by each community's main highlight.",
  },
  {
    key: "community-tags",
    defaultTitle: "Communities by tag",
    description: "Rows grouped by community tags (gated, luxury, etc.).",
  },
  {
    key: "home-tags",
    defaultTitle: "Homes by tag",
    description: "Rows grouped by home model tags.",
  },
  {
    key: "lenders",
    defaultTitle: "Lenders",
    description: "Lender profiles and offers row.",
    manageTab: "lenders",
  },
  {
    key: "cities",
    defaultTitle: "Browse by city",
    description: "One row per city in the catalog.",
  },
  {
    key: "all-communities",
    defaultTitle: "All Communities",
    description: "Full catalog row at the bottom.",
  },
];

const CATALOG_BY_KEY = new Map(
  HOMEPAGE_SECTION_CATALOG.map((entry) => [entry.key, entry]),
);

export function getHomepageSectionLabel(key: HomepageSectionKey): string {
  return CATALOG_BY_KEY.get(key)?.defaultTitle ?? key;
}

export function getHomepageSectionDescription(key: HomepageSectionKey): string {
  return CATALOG_BY_KEY.get(key)?.description ?? "";
}

/** Default layout when the database has no rows yet. */
export function buildDefaultHomepageSections(): HomepageSection[] {
  return HOMEPAGE_SECTION_CATALOG.map((entry, index) => ({
    id: `default-${entry.key}`,
    sectionKey: entry.key,
    title: undefined,
    enabled: true,
    order: index * 10,
  }));
}

/** Merge DB rows with the catalog so every section type exists once. */
export function resolveHomepageSections(
  rows: HomepageSection[] | undefined,
): HomepageSection[] {
  const source =
    rows && rows.length > 0 ? rows : buildDefaultHomepageSections();
  const byKey = new Map(source.map((row) => [row.sectionKey, row]));
  const defaults = buildDefaultHomepageSections();

  for (const fallback of defaults) {
    if (!byKey.has(fallback.sectionKey)) {
      byKey.set(fallback.sectionKey, fallback);
    }
  }

  return [...byKey.values()]
    .filter((row) => row.enabled)
    .sort((a, b) => a.order - b.order);
}

export function resolveHomepageSectionTitle(section: HomepageSection): string {
  const trimmed = section.title?.trim();
  if (trimmed) return trimmed;
  return getHomepageSectionLabel(section.sectionKey);
}

export function resolveTop10Communities(
  slots: Top10CommunitySlot[],
  communities: Community[],
  filtered: Community[],
): Community[] {
  const visible = new Set(filtered.map((c) => c.id));
  return sortTop10Slots(slots)
    .map((slot) => communities.find((c) => c.id === slot.communityId))
    .filter((c): c is Community => c !== undefined && visible.has(c.id));
}

export function isHomepageSectionEnabled(
  sections: HomepageSection[],
  key: HomepageSectionKey,
): boolean {
  return sections.some((s) => s.sectionKey === key && s.enabled);
}
