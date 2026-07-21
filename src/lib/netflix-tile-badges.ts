import {
  getCommunityTagLabel,
} from "@/lib/tag-labels";
import { hasActiveOffers } from "@/lib/community-utils";
import type { Community, Home } from "@/lib/types";

export type TileBadge = {
  id: string;
  label: string;
  tone: "top10" | "offer" | "new" | "tag" | "brand" | "status";
};

/** Communities newer than this show a "Recently Added" badge. */
export const RECENTLY_ADDED_DAYS = 14;
const NEW_MS = 1000 * 60 * 60 * 24 * RECENTLY_ADDED_DAYS;

export function getCommunityTileBadges(
  community: Community,
  opts?: {
    top10Rank?: number | null;
    tagLabels?: Record<string, string>;
    maxTags?: number;
  },
): TileBadge[] {
  const badges: TileBadge[] = [];
  const maxTags = opts?.maxTags ?? 2;

  if (opts?.top10Rank != null && opts.top10Rank > 0) {
    badges.push({
      id: "top10",
      label: `Top ${opts.top10Rank}`,
      tone: "top10",
    });
  }

  if (hasActiveOffers(community)) {
    badges.push({ id: "offers", label: "Offers", tone: "offer" });
  }

  if (Date.now() - community.createdAt < NEW_MS) {
    badges.push({ id: "new", label: "Recently Added", tone: "new" });
  }

  for (const tag of community.tags ?? []) {
    if (badges.filter((b) => b.tone === "tag").length >= maxTags) break;
    badges.push({
      id: `tag-${tag}`,
      label: getCommunityTagLabel(tag, opts?.tagLabels),
      tone: "tag",
    });
  }

  return badges;
}

export function getHomeTileBadges(
  home: Home,
  community: Community,
): TileBadge[] {
  const badges: TileBadge[] = [];

  if (home.youtubeUrl || community.youtubeUrl) {
    badges.push({ id: "video", label: "Video Tour", tone: "status" });
  }

  if (home.tags?.includes("move-in-ready")) {
    badges.push({ id: "ready", label: "Move-In Ready", tone: "offer" });
  } else if (home.tags?.[0]) {
    const label = home.tags[0]
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
    badges.push({ id: `htag-${home.tags[0]}`, label, tone: "tag" });
  }

  if (hasActiveOffers(community)) {
    badges.push({ id: "offers", label: "Offers", tone: "offer" });
  }

  return badges;
}
