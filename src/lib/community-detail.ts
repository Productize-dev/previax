import { getPriceRange } from "./community-utils";
import { getCommunityBuilderNames } from "./community-builders";
import type { Community } from "./types";

/** Max length for main highlight (Netflix genre slot on community detail). */
export const MAIN_HIGHLIGHT_MAX_LENGTH = 36;

export function truncateMainHighlight(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= MAIN_HIGHLIGHT_MAX_LENGTH) return trimmed;
  return `${trimmed.slice(0, MAIN_HIGHLIGHT_MAX_LENGTH - 1).trimEnd()}…`;
}

export function getCommunityYear(community: Community): number {
  return new Date(community.createdAt).getFullYear();
}

export function getCommunityModelCount(community: Community): number {
  return community.homes.filter((home) => home.status !== "sold").length;
}

export function buildCommunityCast(community: Community): string[] {
  const names = [
    ...getCommunityBuilderNames(community),
    ...(community.lenders ?? []),
  ].filter(Boolean);
  return [...new Set(names)];
}

export function buildCommunityShortDescription(community: Community): string {
  const priceRange = getPriceRange(community);
  const base = community.description.trim();
  const maxLength = 220;

  let text =
    base.length > maxLength
      ? `${base.slice(0, maxLength - 1).trimEnd()}…`
      : base;

  if (priceRange) {
    text = `${text} Homes from ${priceRange.label}.`;
  }

  return text;
}
