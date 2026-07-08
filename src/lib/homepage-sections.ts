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
};

export type CommunitySection = {
  id: string;
  title: string;
  communities: Community[];
};

function sectionSlug(prefix: string, key: string): string {
  const slug = key
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${prefix}-${slug || "section"}`;
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

  return CATEGORY_ORDER.filter((category) => grouped.has(category)).map(
    (category) => ({
      id: sectionSlug("category", category),
      title: HOME_LISTING_CATEGORY_LABELS[category],
      items: grouped.get(category)!,
    }),
  );
}

export function buildMainHighlightSections(
  communities: Community[],
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

  return [...grouped.entries()]
    .filter(([, items]) => items.length > 0)
    .map(([highlight, items]) => ({
      id: sectionSlug("highlight", highlight),
      title: highlight,
      items,
    }));
}

export function buildCommunityTagSections(
  communities: Community[],
  customLabels: Record<string, string> = {},
): CommunitySection[] {
  const grouped = new Map<string, Community[]>();

  for (const community of communities) {
    for (const tag of community.tags ?? []) {
      const list = grouped.get(tag) ?? [];
      list.push(community);
      grouped.set(tag, list);
    }
  }

  return [...grouped.entries()]
    .sort(([tagA], [tagB]) =>
      getCommunityTagLabel(tagA, customLabels).localeCompare(
        getCommunityTagLabel(tagB, customLabels),
      ),
    )
    .map(([tag, tagCommunities]) => ({
      id: sectionSlug("community-tag", tag),
      title: getCommunityTagLabel(tag, customLabels),
      communities: tagCommunities,
    }));
}

export function buildHomeTagSections(communities: Community[]): HomeSection[] {
  const grouped = new Map<HomeTag, HomeRowItem[]>();

  for (const item of collectAvailableHomes(communities)) {
    for (const tag of item.home.tags ?? []) {
      const list = grouped.get(tag) ?? [];
      list.push(item);
      grouped.set(tag, list);
    }
  }

  return (Object.keys(HOME_TAG_LABELS) as HomeTag[])
    .filter((tag) => grouped.has(tag))
    .map((tag) => ({
      id: sectionSlug("home-tag", tag),
      title: HOME_TAG_LABELS[tag],
      items: grouped.get(tag)!,
    }));
}

export function buildCitySections(communities: Community[]): CommunitySection[] {
  const grouped = new Map<string, Community[]>();

  for (const community of communities) {
    const list = grouped.get(community.city) ?? [];
    list.push(community);
    grouped.set(community.city, list);
  }

  return [...grouped.entries()]
    .sort(([cityA], [cityB]) => cityA.localeCompare(cityB))
    .map(([city, cityCommunities]) => ({
      id: sectionSlug("city", city),
      title: city,
      communities: cityCommunities,
    }));
}
