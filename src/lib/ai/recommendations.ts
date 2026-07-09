import { getPriceRange, hasActiveOffers } from "@/lib/community-utils";
import type { Community } from "@/lib/types";

import type { AiRecommendationRow, AiSearchContext } from "./types";

function budgetRange(budget?: string): { min?: number; max?: number } {
  switch (budget) {
    case "Under $400K":
      return { max: 450_000 };
    case "$400K – $550K":
      return { min: 350_000, max: 600_000 };
    case "$550K – $700K":
      return { min: 500_000, max: 750_000 };
    case "$700K+":
      return { min: 650_000 };
    default:
      return {};
  }
}

function inBudget(community: Community, min?: number, max?: number): boolean {
  const range = getPriceRange(community);
  if (!range) return false;
  if (min !== undefined && range.max < min) return false;
  if (max !== undefined && range.min > max) return false;
  return true;
}

function meetsBeds(community: Community, beds?: string): boolean {
  if (!beds || beds === "any-beds") return true;
  const min = Number(beds);
  if (Number.isNaN(min)) return true;
  return community.homes.some((h) => h.bedrooms >= min);
}

function hasGoodSchools(community: Community): boolean {
  if (community.schoolDistrict?.trim()) return true;
  return (community.schools ?? []).some((s) => {
    const rating = Number.parseFloat(s.rating ?? "");
    return !Number.isNaN(rating) && rating >= 7;
  });
}

/** Rows personalizadas estilo Netflix (reglas + señales del comprador). */
export function buildRecommendationRows(
  communities: Community[],
  context: AiSearchContext,
): AiRecommendationRow[] {
  const rows: AiRecommendationRow[] = [];
  const used = new Set<string>();
  const { min: budgetMin, max: budgetMax } = budgetRange(context.budget);

  const saved = (context.savedIds ?? [])
    .map((id) => communities.find((c) => c.id === id))
    .filter((c): c is Community => Boolean(c));

  if (saved.length > 0) {
    const anchor = saved[0];
    const similar = communities.filter(
      (c) =>
        c.id !== anchor.id &&
        !used.has(c.id) &&
        (c.city === anchor.city ||
          (c.tags ?? []).some((t) => (anchor.tags ?? []).includes(t))),
    );
    similar.slice(0, 12).forEach((c) => used.add(c.id));
    if (similar.length > 0) {
      rows.push({
        id: "because-saved",
        title: `Because you saved ${anchor.name}`,
        type: "community",
        communityIds: similar.slice(0, 12).map((c) => c.id),
      });
    }
  }

  const forYou = communities
    .filter((c) => !used.has(c.id))
    .filter((c) => inBudget(c, budgetMin, budgetMax))
    .filter((c) => meetsBeds(c, context.beds))
    .slice(0, 12);
  forYou.forEach((c) => used.add(c.id));
  if (forYou.length > 0) {
    rows.push({
      id: "for-you",
      title: "For you",
      type: "community",
      communityIds: forYou.map((c) => c.id),
    });
  }

  const inBudgetList = communities
    .filter((c) => !used.has(c.id) && inBudget(c, budgetMin, budgetMax))
    .slice(0, 12);
  inBudgetList.forEach((c) => used.add(c.id));
  if (inBudgetList.length > 0 && (budgetMin !== undefined || budgetMax !== undefined)) {
    rows.push({
      id: "in-budget",
      title: "In your budget",
      type: "community",
      communityIds: inBudgetList.map((c) => c.id),
    });
  }

  const schoolRows = communities
    .filter((c) => !used.has(c.id) && hasGoodSchools(c))
    .slice(0, 12);
  schoolRows.forEach((c) => used.add(c.id));
  if (schoolRows.length > 0) {
    rows.push({
      id: "good-schools",
      title: "Near great schools",
      type: "community",
      communityIds: schoolRows.map((c) => c.id),
    });
  }

  if (context.cities?.length) {
    const citySet = new Set(context.cities.map((c) => c.toLowerCase()));
    const cityMatches = communities
      .filter(
        (c) => !used.has(c.id) && citySet.has(c.city.toLowerCase()),
      )
      .slice(0, 12);
    cityMatches.forEach((c) => used.add(c.id));
    if (cityMatches.length > 0) {
      rows.push({
        id: "your-cities",
        title: "In your preferred cities",
        type: "community",
        communityIds: cityMatches.map((c) => c.id),
      });
    }
  }

  const withOffers = communities
    .filter((c) => !used.has(c.id) && hasActiveOffers(c))
    .slice(0, 12);
  if (withOffers.length > 0) {
    rows.push({
      id: "builder-offers",
      title: "Communities with builder offers",
      type: "community",
      communityIds: withOffers.map((c) => c.id),
    });
  }

  return rows;
}
