import {
  CATEGORY_ORDER,
  getHomeListingCategories,
  HOME_LISTING_CATEGORY_LABELS,
} from "@/lib/home-listing-categories";
import { getCommunityTagLabel } from "@/lib/tag-labels";
import { HOME_TAG_LABELS } from "@/lib/tag-labels";
import type {
  Community,
  Home,
  HomeListingCategory,
  HomepageSectionConfig,
  HomeTag,
} from "@/lib/types";

export type HomeRowItem = {
  home: Home;
  community: Community;
};

export type HomeSection = {
  id: string;
  title: string;
  items: HomeRowItem[];
  /** Stable key used for includeKeys filtering in the dashboard. */
  filterKey: string;
};

export type CommunitySection = {
  id: string;
  title: string;
  communities: Community[];
  filterKey: string;
};

export type SectionFilterOption = {
  key: string;
  label: string;
  count: number;
};

function sectionSlug(prefix: string, key: string): string {
  const slug = key
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${prefix}-${slug || "section"}`;
}

/** Apply includeKeys filter + optional custom order. null/undefined = all. */
export function filterSectionsByConfig<T extends { filterKey: string }>(
  sections: T[],
  config?: HomepageSectionConfig | null,
): T[] {
  const includeKeys = config?.includeKeys;
  if (includeKeys == null) return sections;
  if (includeKeys.length === 0) return [];

  const byKey = new Map(sections.map((section) => [section.filterKey, section]));
  return includeKeys
    .map((key) => byKey.get(key))
    .filter((section): section is T => Boolean(section));
}

export function collectAvailableHomes(communities: Community[]): HomeRowItem[] {
  return communities.flatMap((community) =>
    community.homes
      .filter((home) => home.status !== "sold")
      .map((home) => ({ home, community })),
  );
}

export function buildListingCategorySections(
  communities: Community[],
  config?: HomepageSectionConfig | null,
): HomeSection[] {
  const grouped = new Map<HomeListingCategory, HomeRowItem[]>();

  for (const item of collectAvailableHomes(communities)) {
    for (const category of getHomeListingCategories(
      item.home,
      item.community,
    )) {
      const list = grouped.get(category) ?? [];
      list.push(item);
      grouped.set(category, list);
    }
  }

  const sections = CATEGORY_ORDER.filter((category) => grouped.has(category)).map(
    (category) => ({
      id: sectionSlug("category", category),
      filterKey: category,
      title: HOME_LISTING_CATEGORY_LABELS[category],
      items: grouped.get(category)!,
    }),
  );

  return filterSectionsByConfig(sections, config);
}

export function collectListingCategoryOptions(
  communities: Community[],
): SectionFilterOption[] {
  const counts = new Map<HomeListingCategory, number>();
  for (const item of collectAvailableHomes(communities)) {
    for (const category of getHomeListingCategories(
      item.home,
      item.community,
    )) {
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
  }
  return CATEGORY_ORDER.filter((category) => counts.has(category)).map(
    (category) => ({
      key: category,
      label: HOME_LISTING_CATEGORY_LABELS[category],
      count: counts.get(category)!,
    }),
  );
}

export function buildMainHighlightSections(
  communities: Community[],
  config?: HomepageSectionConfig | null,
): HomeSection[] {
  const grouped = new Map<string, HomeRowItem[]>();

  for (const community of communities) {
    const highlight = community.mainHighlight?.trim();
    if (!highlight) continue;

    const list = grouped.get(highlight) ?? [];
    for (const home of community.homes.filter((h) => h.status !== "sold")) {
      list.push({ home, community });
    }
    grouped.set(highlight, list);
  }

  const sections = [...grouped.entries()]
    .filter(([, items]) => items.length > 0)
    .map(([highlight, items]) => ({
      id: sectionSlug("highlight", highlight),
      filterKey: highlight,
      title: highlight,
      items,
    }));

  return filterSectionsByConfig(sections, config);
}

export function collectMainHighlightOptions(
  communities: Community[],
): SectionFilterOption[] {
  const counts = new Map<string, number>();
  for (const community of communities) {
    const highlight = community.mainHighlight?.trim();
    if (!highlight) continue;
    const homeCount = community.homes.filter((h) => h.status !== "sold").length;
    if (homeCount === 0) continue;
    counts.set(highlight, (counts.get(highlight) ?? 0) + homeCount);
  }
  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => ({ key, label: key, count }));
}

export function buildCommunityTagSections(
  communities: Community[],
  customLabels: Record<string, string> = {},
  config?: HomepageSectionConfig | null,
): CommunitySection[] {
  const grouped = new Map<string, Community[]>();

  for (const community of communities) {
    for (const tag of community.tags ?? []) {
      const list = grouped.get(tag) ?? [];
      list.push(community);
      grouped.set(tag, list);
    }
  }

  const sections = [...grouped.entries()]
    .sort(([tagA], [tagB]) =>
      getCommunityTagLabel(tagA, customLabels).localeCompare(
        getCommunityTagLabel(tagB, customLabels),
      ),
    )
    .map(([tag, tagCommunities]) => ({
      id: sectionSlug("community-tag", tag),
      filterKey: tag,
      title: getCommunityTagLabel(tag, customLabels),
      communities: tagCommunities,
    }));

  return filterSectionsByConfig(sections, config);
}

export function collectCommunityTagOptions(
  communities: Community[],
  customLabels: Record<string, string> = {},
): SectionFilterOption[] {
  const counts = new Map<string, number>();
  for (const community of communities) {
    for (const tag of community.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort(([a], [b]) =>
      getCommunityTagLabel(a, customLabels).localeCompare(
        getCommunityTagLabel(b, customLabels),
      ),
    )
    .map(([key, count]) => ({
      key,
      label: getCommunityTagLabel(key, customLabels),
      count,
    }));
}

export function buildHomeTagSections(
  communities: Community[],
  config?: HomepageSectionConfig | null,
): HomeSection[] {
  const grouped = new Map<HomeTag, HomeRowItem[]>();

  for (const item of collectAvailableHomes(communities)) {
    for (const tag of item.home.tags ?? []) {
      const list = grouped.get(tag) ?? [];
      list.push(item);
      grouped.set(tag, list);
    }
  }

  const sections = (Object.keys(HOME_TAG_LABELS) as HomeTag[])
    .filter((tag) => grouped.has(tag))
    .map((tag) => ({
      id: sectionSlug("home-tag", tag),
      filterKey: tag,
      title: HOME_TAG_LABELS[tag],
      items: grouped.get(tag)!,
    }));

  return filterSectionsByConfig(sections, config);
}

export function collectHomeTagOptions(
  communities: Community[],
): SectionFilterOption[] {
  const counts = new Map<HomeTag, number>();
  for (const item of collectAvailableHomes(communities)) {
    for (const tag of item.home.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return (Object.keys(HOME_TAG_LABELS) as HomeTag[])
    .filter((tag) => counts.has(tag))
    .map((tag) => ({
      key: tag,
      label: HOME_TAG_LABELS[tag],
      count: counts.get(tag)!,
    }));
}

export function buildCitySections(
  communities: Community[],
  config?: HomepageSectionConfig | null,
): CommunitySection[] {
  const grouped = new Map<string, Community[]>();

  for (const community of communities) {
    const list = grouped.get(community.city) ?? [];
    list.push(community);
    grouped.set(community.city, list);
  }

  const sections = [...grouped.entries()]
    .sort(([cityA], [cityB]) => cityA.localeCompare(cityB))
    .map(([city, cityCommunities]) => ({
      id: sectionSlug("city", city),
      filterKey: city,
      title: city,
      communities: cityCommunities,
    }));

  return filterSectionsByConfig(sections, config);
}

export function collectCityOptions(
  communities: Community[],
): SectionFilterOption[] {
  const counts = new Map<string, number>();
  for (const community of communities) {
    counts.set(community.city, (counts.get(community.city) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => ({ key, label: key, count }));
}

/** Section keys that support includeKeys filtering in the layout manager. */
export const FILTERABLE_HOMEPAGE_SECTION_KEYS = [
  "listing-categories",
  "main-highlights",
  "community-tags",
  "home-tags",
  "cities",
] as const;

export type FilterableHomepageSectionKey =
  (typeof FILTERABLE_HOMEPAGE_SECTION_KEYS)[number];

export function isFilterableHomepageSectionKey(
  key: string,
): key is FilterableHomepageSectionKey {
  return (FILTERABLE_HOMEPAGE_SECTION_KEYS as readonly string[]).includes(key);
}
