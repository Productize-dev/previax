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
  /** Built-in sections appear once; custom-videos can be added many times. */
  builtin?: boolean;
};

export const HOMEPAGE_SECTION_CATALOG: HomepageSectionCatalogEntry[] = [
  {
    key: "hero",
    defaultTitle: "Hero carousel",
    description: "Featured video slides at the top of the homepage.",
    manageTab: "featured",
    builtin: true,
  },
  {
    key: "personalized",
    defaultTitle: "For you",
    description: "AI-personalized community rows based on buyer activity.",
    builtin: true,
  },
  {
    key: "my-list",
    defaultTitle: "My List",
    description: "Communities the buyer saved (heart icon).",
    builtin: true,
  },
  {
    key: "saved-homes",
    defaultTitle: "Saved Homes",
    description: "Individual home models the buyer saved.",
    builtin: true,
  },
  {
    key: "liked-communities",
    defaultTitle: "Liked Communities",
    description: "Communities the buyer liked (thumbs up).",
    builtin: true,
  },
  {
    key: "liked-homes",
    defaultTitle: "Liked Homes",
    description: "Home models the buyer liked.",
    builtin: true,
  },
  {
    key: "trending",
    defaultTitle: "Trending Now",
    description: "Newest communities by date added.",
    builtin: true,
  },
  {
    key: "featured-communities",
    defaultTitle: "Featured Communities",
    description: "Admin-curated community row.",
    manageTab: "featured-communities",
    builtin: true,
  },
  {
    key: "top-10",
    defaultTitle: "Top 10 Communities",
    description: "Ranked communities from the Top 10 manager.",
    manageTab: "top-10",
    builtin: true,
  },
  {
    key: "listing-categories",
    defaultTitle: "Homes by category",
    description:
      "Rows grouped by listing badges (Top 10, zero down, incentives, etc.).",
    builtin: true,
  },
  {
    key: "main-highlights",
    defaultTitle: "Homes by highlight",
    description: "Rows grouped by each community's main highlight.",
    builtin: true,
  },
  {
    key: "community-tags",
    defaultTitle: "Communities by tag",
    description: "Rows grouped by community tags (gated, luxury, etc.).",
    builtin: true,
  },
  {
    key: "home-tags",
    defaultTitle: "Homes by tag",
    description: "Rows grouped by home model tags.",
    builtin: true,
  },
  {
    key: "lenders",
    defaultTitle: "Lenders",
    description: "Lender profiles and offers row.",
    manageTab: "lenders",
    builtin: true,
  },
  {
    key: "cities",
    defaultTitle: "Browse by city",
    description: "One row per city in the catalog.",
    builtin: true,
  },
  {
    key: "all-communities",
    defaultTitle: "All Communities",
    description: "Full catalog row at the bottom.",
    builtin: true,
  },
  {
    key: "rent-apartments",
    defaultTitle: "Rent while you relocate",
    description:
      "Apartment rentals for relocators — bridge housing before buying.",
    builtin: true,
  },
  {
    key: "custom-videos",
    defaultTitle: "Custom video row",
    description:
      "Admin-curated YouTube videos (brand stories, By Previax, etc.).",
    builtin: false,
  },
];

const CATALOG_BY_KEY = new Map(
  HOMEPAGE_SECTION_CATALOG.map((entry) => [entry.key, entry]),
);

export function isCustomVideoSection(section: {
  sectionKey: HomepageSectionKey;
}): boolean {
  return section.sectionKey === "custom-videos";
}

export function getHomepageSectionLabel(key: HomepageSectionKey): string {
  return CATALOG_BY_KEY.get(key)?.defaultTitle ?? key;
}

export function getHomepageSectionDescription(key: HomepageSectionKey): string {
  return CATALOG_BY_KEY.get(key)?.description ?? "";
}

/** Default layout when the database has no rows yet. */
export function buildDefaultHomepageSections(): HomepageSection[] {
  return HOMEPAGE_SECTION_CATALOG.filter((entry) => entry.builtin !== false).map(
    (entry, index) => ({
      id: `default-${entry.key}`,
      sectionKey: entry.key,
      title: undefined,
      enabled: true,
      order: index * 10,
    }),
  );
}

/**
 * Merge DB rows with the catalog so every built-in section type exists once.
 * Custom video rows are kept as-is (multiple allowed).
 */
export function resolveHomepageSections(
  rows: HomepageSection[] | undefined,
): HomepageSection[] {
  const source =
    rows && rows.length > 0 ? rows : buildDefaultHomepageSections();

  const builtinRows = source.filter((row) => !isCustomVideoSection(row));
  const customRows = source.filter(isCustomVideoSection);
  const byKey = new Map(builtinRows.map((row) => [row.sectionKey, row]));
  const defaults = buildDefaultHomepageSections();

  for (const fallback of defaults) {
    if (!byKey.has(fallback.sectionKey)) {
      byKey.set(fallback.sectionKey, fallback);
    }
  }

  return [...byKey.values(), ...customRows]
    .filter((row) => row.enabled)
    .sort((a, b) => a.order - b.order);
}

export function resolveHomepageSectionTitle(section: HomepageSection): string {
  const trimmed = section.title?.trim();
  if (trimmed) return trimmed;
  if (isCustomVideoSection(section)) return "By Previax";
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
