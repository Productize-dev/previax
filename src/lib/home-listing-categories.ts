import { hasActiveOffers } from "@/lib/community-utils";
import type { Community, Home, HomeListingCategory } from "@/lib/types";

export const HOME_LISTING_CATEGORY_LABELS: Record<
  HomeListingCategory,
  string
> = {
  "zero-down": "0% Down Payment",
  "one-level": "One-Level Home",
  "master-on-main-3-beds": "Master on Main · 3 Beds",
  "big-incentives": "Big Incentives",
  "top-ten": "Top 10",
};

export const ALL_HOME_LISTING_CATEGORIES = Object.keys(
  HOME_LISTING_CATEGORY_LABELS,
) as HomeListingCategory[];

export const CATEGORY_ORDER: HomeListingCategory[] = [
  "top-ten",
  "zero-down",
  "big-incentives",
  "one-level",
  "master-on-main-3-beds",
];

export const HOME_LISTING_CATEGORY_STYLES: Record<
  HomeListingCategory,
  string
> = {
  "top-ten": "bg-[#e50914] text-white",
  "zero-down": "bg-white text-black",
  "big-incentives": "bg-[#46d369] text-black",
  "one-level": "bg-black/75 text-white ring-1 ring-white/25",
  "master-on-main-3-beds": "bg-black/75 text-white ring-1 ring-white/25",
};

function hasMasterOnMainThreeBeds(home: Home): boolean {
  if (home.bedrooms < 3) return false;

  const text = [
    home.tagline,
    home.description,
    home.featuresOverview,
    ...(home.highlights ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    home.tags?.includes("single-story") ||
    (text.includes("primary") && text.includes("main")) ||
    text.includes("main level") ||
    text.includes("main-level")
  );
}

function hasZeroDown(home: Home): boolean {
  const text = [
    home.tagline,
    home.description,
    home.featuresOverview,
    ...(home.highlights ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    home.listingCategories?.includes("zero-down") ||
    text.includes("0% down") ||
    text.includes("zero down")
  );
}

export function getHomeListingCategories(
  home: Home,
  community: Community,
): HomeListingCategory[] {
  const found = new Set<HomeListingCategory>(home.listingCategories ?? []);

  if (home.tags?.includes("single-story")) {
    found.add("one-level");
  }

  if (hasMasterOnMainThreeBeds(home)) {
    found.add("master-on-main-3-beds");
  }

  if (hasActiveOffers(community)) {
    found.add("big-incentives");
  }

  if (hasZeroDown(home)) {
    found.add("zero-down");
  }

  return CATEGORY_ORDER.filter((category) => found.has(category));
}
