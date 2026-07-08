import type { Builder, Series } from "./types";

export const seedBuilders: Builder[] = [
  {
    id: "seed-builder-lennar",
    name: "Lennar",
    description: "Everything's Included® new homes across the Charlotte metro.",
    createdAt: Date.now() - 86400000 * 30,
  },
];

export const seedSeries: Series[] = [
  {
    id: "seed-series-waxhaw",
    builderId: "seed-builder-lennar",
    name: "Village of Waxhaw Collection",
    description: "Spacious townhomes with two-car garages in Waxhaw, NC.",
    thumbnailUrl:
      "https://img.youtube.com/vi/rObOyU4SXuw/hqdefault.jpg",
    youtubeUrl: "https://www.youtube.com/watch?v=rObOyU4SXuw",
    createdAt: Date.now() - 86400000 * 20,
  },
];

export const seedHomepageSeries = [
  { id: "hp-series-1", seriesId: "seed-series-waxhaw", order: 0 },
] as const;
