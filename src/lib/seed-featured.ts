import type { AppData, FeaturedItem, HomepageHomesRow, HomepageSeriesRow } from "./types";
import { buildDefaultHomepageSections } from "./homepage-layout";
import { seedBuilders, seedHomepageSeries, seedSeries } from "./seed-builders";
import { seedCommunities } from "./seed-data";
import { seedLenders } from "./seed-lenders";
import { seedFeaturedCommunities } from "./seed-featured-communities";
import { seedTop10Communities } from "./seed-top-10-communities";

export const seedFeatured: FeaturedItem[] = [
  {
    id: "feat-1",
    title: "Village of Waxhaw",
    subtitle: "Waxhaw, North Carolina",
    youtubeUrl: "https://www.youtube.com/watch?v=rObOyU4SXuw",
    communityId: "seed-waxhaw",
    order: 0,
  },
];

/** @deprecated Kept for migration reference */
export const seedHomepageHomes: HomepageHomesRow[] = [
  { id: "hp-homes-1", communityId: "seed-waxhaw", order: 0 },
];

export const seedHomepageSeriesRows: HomepageSeriesRow[] = [...seedHomepageSeries];

export function buildSeedAppData(): AppData {
  return {
    communities: seedCommunities,
    featured: seedFeatured,
    lenders: seedLenders,
    lenderOffers: [],
    featuredCommunities: seedFeaturedCommunities,
    top10Communities: seedTop10Communities,
    customCommunityTagLabels: { townhomes: "Townhomes" },
    builders: seedBuilders,
    series: seedSeries,
    homepageSeries: seedHomepageSeriesRows,
    homepageHomes: seedHomepageHomes,
    homepageSections: buildDefaultHomepageSections(),
  };
}
