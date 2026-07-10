/** Stable key for a home in buyer localStorage lists. */
export function homeRef(communityId: string, homeId: string): string {
  return `${communityId}:${homeId}`;
}

export function parseHomeRef(ref: string): { communityId: string; homeId: string } | null {
  const idx = ref.indexOf(":");
  if (idx <= 0) return null;
  return {
    communityId: ref.slice(0, idx),
    homeId: ref.slice(idx + 1),
  };
}
