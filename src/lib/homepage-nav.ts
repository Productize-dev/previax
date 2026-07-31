import {
  resolveHomepageSectionTitle,
  resolveHomepageSections,
} from "@/lib/homepage-layout";
import { appHash } from "@/lib/routes";
import type { HomepageSection, HomepageSectionKey } from "@/lib/types";

export type HomepageNavLink = {
  /** DOM id on the homepage (or page path for My List). */
  id: string;
  label: string;
  href: string;
};

const COMMUNITY_NAV_KEYS: HomepageSectionKey[] = [
  "featured-communities",
  "top-10",
  "trending",
  "personalized",
  "my-list",
  "liked-communities",
  "community-tags",
  "cities",
  "all-communities",
];

const HOME_NAV_KEYS: HomepageSectionKey[] = [
  "listing-categories",
  "main-highlights",
  "home-tags",
  "saved-homes",
  "liked-homes",
];

export const NAV_COMMUNITIES_ID = "nav-communities";
export const NAV_HOMES_ID = "nav-homes";

export function isCommunityNavSection(key: HomepageSectionKey): boolean {
  return COMMUNITY_NAV_KEYS.includes(key);
}

export function isHomeNavSection(key: HomepageSectionKey): boolean {
  return HOME_NAV_KEYS.includes(key);
}

export function customVideoNavId(sectionId: string): string {
  return `nav-${sectionId}`;
}

/**
 * Intent-based header links from the visible homepage layout.
 * Skips destinations whose sections are hidden; My List always links to /saved.
 */
export function buildHomepageNavLinks(
  sections: HomepageSection[] | undefined,
): HomepageNavLink[] {
  const visible = resolveHomepageSections(sections);
  const links: HomepageNavLink[] = [];

  if (visible.some((section) => isCommunityNavSection(section.sectionKey))) {
    links.push({
      id: NAV_COMMUNITIES_ID,
      label: "Communities",
      href: appHash(NAV_COMMUNITIES_ID),
    });
  }

  if (visible.some((section) => isHomeNavSection(section.sectionKey))) {
    links.push({
      id: NAV_HOMES_ID,
      label: "Homes",
      href: appHash(NAV_HOMES_ID),
    });
  }

  for (const section of visible) {
    if (section.sectionKey !== "custom-videos") continue;
    // Only surface rows that actually have videos to avoid empty jumps.
    if ((section.videos?.length ?? 0) === 0) continue;
    const id = customVideoNavId(section.id);
    links.push({
      id,
      label: resolveHomepageSectionTitle(section),
      href: appHash(id),
    });
  }

  links.push({
    id: "my-list",
    label: "My List",
    href: "/saved",
  });

  return links;
}
