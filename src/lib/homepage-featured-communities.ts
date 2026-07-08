import type { Community, FeaturedCommunityRow } from "@/lib/types";

export function resolveFeaturedCommunities(
  rows: FeaturedCommunityRow[],
  communities: Community[],
  visibleCommunities: Community[],
): Community[] {
  const visibleIds = new Set(visibleCommunities.map((community) => community.id));

  return [...rows]
    .sort((a, b) => a.order - b.order)
    .map((row) => communities.find((community) => community.id === row.communityId))
    .filter((community): community is Community => {
      if (!community) return false;
      return visibleIds.has(community.id);
    });
}
