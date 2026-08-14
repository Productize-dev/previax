import type { ApartmentCommunity } from "./types";
import { formatPrice } from "./community-utils";

export function isApartmentCommunityPublic(
  community: ApartmentCommunity,
): boolean {
  return !community.isHidden;
}

export function getPublicApartmentCommunities(
  communities: ApartmentCommunity[],
): ApartmentCommunity[] {
  return communities.filter(isApartmentCommunityPublic);
}

export function formatRent(rent: number): string {
  if (rent <= 0) return "";
  if (rent >= 10_000) {
    return `$${Math.round(rent / 1000)}K/mo`;
  }
  return `$${Math.round(rent).toLocaleString()}/mo`;
}

export function getRentRange(community: ApartmentCommunity): {
  min: number;
  max: number;
  label: string;
} | null {
  const rents = community.floorPlans
    .filter((p) => p.status !== "leased")
    .map((p) => p.rent)
    .filter((r) => r > 0);

  if (rents.length === 0) return null;

  const min = Math.min(...rents);
  const max = Math.max(...rents);
  const label =
    min === max
      ? `From ${formatRent(min)}`
      : `${formatRent(min)} – ${formatRent(max)}`;

  return { min, max, label };
}

export function getAvailableFloorPlanCount(
  community: ApartmentCommunity,
): number {
  return community.floorPlans.filter(
    (p) => !p.status || p.status === "available",
  ).length;
}

/** Sale-price helper reused when showing nearby buy communities. */
export { formatPrice };
