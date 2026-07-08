import type { Top10CommunitySlot } from "./types";

export const seedTop10Communities: Top10CommunitySlot[] = [
  { id: "top10-1", communityId: "seed-waxhaw", rank: 1 },
];

export function buildTop10FromCommunityIds(
  communityIds: string[],
  limit = 10,
): Top10CommunitySlot[] {
  return communityIds.slice(0, limit).map((communityId, index) => ({
    id: crypto.randomUUID(),
    communityId,
    rank: index + 1,
  }));
}
