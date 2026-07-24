import type { Community, Home } from "./types";

export function formatPrice(price: number): string {
  if (price >= 1_000_000) {
    return `$${(price / 1_000_000).toFixed(2)}M`.replace(".00M", "M");
  }
  return `$${Math.round(price / 1000)}K`;
}

export function getPriceRange(community: Community): {
  min: number;
  max: number;
  label: string;
} | null {
  const prices = community.homes
    .filter((h) => h.status !== "sold")
    .map((h) => h.price)
    .filter((p) => p > 0);

  if (prices.length === 0) return null;

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const label =
    min === max
      ? `From ${formatPrice(min)}`
      : `${formatPrice(min)} – ${formatPrice(max)}`;

  return { min, max, label };
}

export function getAvailableHomeCount(community: Community): number {
  return community.homes.filter(
    (h) => !h.status || h.status === "available",
  ).length;
}

export function hasActiveOffers(community: Community): boolean {
  return community.builderOffers.trim().length > 0;
}

export function getFirstOfferTeaser(community: Community): string | null {
  const first = community.builderOffers
    .split("\n")
    .map((l) => l.trim())
    .find(Boolean);
  return first ?? null;
}

export function getUniqueCities(communities: Community[]): string[] {
  return [...new Set(communities.map((c) => c.city))].sort();
}

/** Visible on the public site (live + not hidden). */
export function isCommunityPublic(community: Community): boolean {
  const status = community.pipelineStatus ?? "live";
  return !community.isHidden && status === "live";
}

export function getPublicCommunities(communities: Community[]): Community[] {
  return communities.filter(isCommunityPublic);
}

export function filterCommunities(
  communities: Community[],
  opts: {
    query?: string;
    city?: string;
    offersOnly?: boolean;
  },
): Community[] {
  let result = getPublicCommunities(communities);

  if (opts.query?.trim()) {
    const q = opts.query.toLowerCase();
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.builderName.toLowerCase().includes(q),
    );
  }

  if (opts.city && opts.city !== "all") {
    result = result.filter((c) => c.city === opts.city);
  }

  if (opts.offersOnly) {
    result = result.filter(hasActiveOffers);
  }

  return result;
}

export function getRelatedCommunities(
  community: Community,
  all: Community[],
  limit = 3,
): Community[] {
  return getPublicCommunities(all)
    .filter((c) => c.id !== community.id && c.city === community.city)
    .slice(0, limit);
}

export function pricePerSqft(home: Home): number | null {
  if (!home.sqft) return null;
  return Math.round(home.price / home.sqft);
}

export function sortHomes(
  homes: Home[],
  sort: "price-asc" | "price-desc" | "beds-desc",
): Home[] {
  const copy = [...homes];
  switch (sort) {
    case "price-asc":
      return copy.sort((a, b) => a.price - b.price);
    case "price-desc":
      return copy.sort((a, b) => b.price - a.price);
    case "beds-desc":
      return copy.sort((a, b) => b.bedrooms - a.bedrooms);
    default:
      return copy;
  }
}

export function filterHomesByBeds(homes: Home[], beds: number | null): Home[] {
  if (!beds) return homes;
  return homes.filter((h) => h.bedrooms >= beds);
}

export type HomeListing = {
  home: Home;
  communityId: string;
  communityName: string;
  city: string;
};

export function getAllHomeListings(communities: Community[]): HomeListing[] {
  return communities.flatMap((community) =>
    community.homes
      .filter((h) => h.status !== "sold")
      .map((home) => ({
        home,
        communityId: community.id,
        communityName: community.name,
        city: community.city,
      })),
  );
}

export function filterHomeListings(
  listings: HomeListing[],
  opts: {
    query?: string;
    city?: string;
    beds?: number | null;
    sort?: "price-asc" | "price-desc" | "beds-desc";
  },
): HomeListing[] {
  let result = listings;

  if (opts.query?.trim()) {
    const q = opts.query.toLowerCase();
    result = result.filter(
      ({ home, communityName, city }) =>
        communityName.toLowerCase().includes(q) ||
        city.toLowerCase().includes(q) ||
        home.description.toLowerCase().includes(q) ||
        String(home.price).includes(q.replace(/\D/g, "")),
    );
  }

  if (opts.city && opts.city !== "all") {
    result = result.filter(({ city }) => city === opts.city);
  }

  if (opts.beds) {
    result = result.filter(({ home }) => home.bedrooms >= opts.beds!);
  }

  if (opts.sort) {
    const homes = result.map((l) => l.home);
    const sorted = sortHomes(homes, opts.sort);
    const order = new Map(sorted.map((h, i) => [h.id, i]));
    result = [...result].sort(
      (a, b) => (order.get(a.home.id) ?? 0) - (order.get(b.home.id) ?? 0),
    );
  }

  return result;
}

export function isOfferExpiringSoon(
  offerExpires?: string,
  withinDays = 30,
): boolean {
  if (!offerExpires) return false;
  const exp = new Date(offerExpires);
  const now = new Date();
  const diff = exp.getTime() - now.getTime();
  return diff > 0 && diff <= withinDays * 86400000;
}

export function isOfferExpired(offerExpires?: string): boolean {
  if (!offerExpires) return false;
  return new Date(offerExpires) < new Date();
}
