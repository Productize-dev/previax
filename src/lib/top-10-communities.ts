import type { Top10CommunitySlot } from "./types";

export function getTop10Rank(
  communityId: string,
  slots: Top10CommunitySlot[],
): number | null {
  const slot = slots.find((item) => item.communityId === communityId);
  return slot?.rank ?? null;
}

export function sortTop10Slots(slots: Top10CommunitySlot[]): Top10CommunitySlot[] {
  return [...slots].sort((a, b) => a.rank - b.rank);
}
