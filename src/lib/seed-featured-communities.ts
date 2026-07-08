import type { FeaturedCommunityRow } from "./types";
import { seedCommunities } from "./seed-data";

export const seedFeaturedCommunities: FeaturedCommunityRow[] =
  seedCommunities.map((community, index) => ({
    id: `featured-${community.id}`,
    communityId: community.id,
    order: index,
  }));

export function buildFeaturedCommunitiesFromIds(
  communityIds: string[],
): FeaturedCommunityRow[] {
  return communityIds.map((communityId, index) => ({
    id: crypto.randomUUID(),
    communityId,
    order: index,
  }));
}
