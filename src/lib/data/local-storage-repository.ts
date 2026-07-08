import { buildSeedAppData } from "../seed-featured";
import { buildFeaturedCommunitiesFromIds } from "../seed-featured-communities";
import { buildTop10FromCommunityIds } from "../seed-top-10-communities";
import { seedLenders } from "../seed-lenders";
import { migrateAppData } from "../migrate";
import { importCatalogFromCsv } from "../csv-catalog-import";
import { syncCommunityBuilderFields, communityHasBuilder } from "../community-builders";
import { sortTop10Slots } from "../top-10-communities";
import type {
  AppData,
  Builder,
  Community,
  FeaturedCommunityRow,
  FeaturedItem,
  Home,
  HomepageHomesRow,
  HomepageSeriesRow,
  Lender,
  Series,
  Top10CommunitySlot,
} from "../types";
import type { SiteRepository } from "./repository";

const STORAGE_KEY = "previax-data";

const EMPTY_APP_DATA: AppData = {
  communities: [],
  featured: [],
  lenders: [],
  featuredCommunities: [],
  top10Communities: [],
  customCommunityTagLabels: {},
  builders: [],
  series: [],
  homepageSeries: [],
  homepageHomes: [],
};

function readStored(): AppData {
  if (typeof window === "undefined") {
    return EMPTY_APP_DATA;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_APP_DATA;

    const parsed: unknown = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return migrateAppData({ communities: parsed });
    }

    return migrateAppData(parsed as Partial<AppData>);
  } catch {
    return EMPTY_APP_DATA;
  }
}

function writeStored(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function ensureSeeded(): AppData {
  let data = readStored();
  if (data.communities.length === 0) {
    data = buildSeedAppData();
    writeStored(data);
    return data;
  }

  let changed = false;

  if (data.featured.length === 0) {
    data.featured = data.communities.slice(0, 3).map((c, i) => ({
      id: crypto.randomUUID(),
      title: c.name,
      subtitle: `${c.city}, North Carolina`,
      youtubeUrl: c.youtubeUrl,
      communityId: c.id,
      order: i,
    }));
    changed = true;
  }

  if (data.lenders.length === 0) {
    data.lenders = seedLenders.map((lender) => ({
      ...lender,
      id: crypto.randomUUID(),
    }));
    changed = true;
  }

  if (data.featuredCommunities.length === 0) {
    data.featuredCommunities = buildFeaturedCommunitiesFromIds(
      data.communities.map((community) => community.id),
    );
    changed = true;
  }

  if (data.top10Communities.length === 0) {
    data.top10Communities = buildTop10FromCommunityIds(
      data.communities.map((community) => community.id),
    );
    changed = true;
  }

  if (data.homepageSeries.length === 0 && data.series.length > 0) {
    data.homepageSeries = data.series.slice(0, 3).map((item, i) => ({
      id: crypto.randomUUID(),
      seriesId: item.id,
      order: i,
    }));
    changed = true;
  } else if (
    data.homepageSeries.length === 0 &&
    data.homepageHomes.length === 0
  ) {
    data.homepageHomes = data.communities
      .filter((c) => c.homes.length > 0)
      .slice(0, 3)
      .map((c, i) => ({
        id: crypto.randomUUID(),
        communityId: c.id,
        order: i,
      }));
    data = migrateAppData(data);
    changed = true;
  }

  if (changed) writeStored(data);
  return data;
}

function sortFeatured(items: FeaturedItem[]): FeaturedItem[] {
  return [...items].sort((a, b) => a.order - b.order);
}

function sortHomepageSeries(items: HomepageSeriesRow[]): HomepageSeriesRow[] {
  return [...items].sort((a, b) => a.order - b.order);
}

function sortLenders(items: Lender[]): Lender[] {
  return [...items].sort((a, b) => a.order - b.order);
}

function sortFeaturedCommunities(
  items: FeaturedCommunityRow[],
): FeaturedCommunityRow[] {
  return [...items].sort((a, b) => a.order - b.order);
}

function sortHomepageHomes(items: HomepageHomesRow[]): HomepageHomesRow[] {
  return [...items].sort((a, b) => a.order - b.order);
}

function removeSeriesFromCommunities(stored: AppData, seriesId: string): void {
  const fallbackSeries = stored.series.find((item) => item.id !== seriesId);
  stored.communities = stored.communities.map((community) => ({
    ...community,
    homes: community.homes.map((home) =>
      home.seriesId === seriesId
        ? { ...home, seriesId: fallbackSeries?.id ?? "" }
        : home,
    ),
  }));
}

export const localStorageRepository: SiteRepository = {
  async getAppData() {
    return ensureSeeded();
  },

  async getAll() {
    return ensureSeeded().communities;
  },

  async getById(id) {
    const { communities } = ensureSeeded();
    return communities.find((c) => c.id === id) ?? null;
  },

  async create(data) {
    const stored = ensureSeeded();
    const community: Community = {
      ...data,
      id: crypto.randomUUID(),
      homes: [],
      createdAt: Date.now(),
      tags: data.tags ?? [],
    };
    stored.communities.push(community);
    writeStored(stored);
    return community;
  },

  async update(id, data) {
    const stored = ensureSeeded();
    const index = stored.communities.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Community not found");

    const updated: Community = {
      ...stored.communities[index],
      ...data,
      id: stored.communities[index].id,
      homes: stored.communities[index].homes,
      createdAt: stored.communities[index].createdAt,
    };
    stored.communities[index] = updated;
    writeStored(stored);
    return updated;
  },

  async delete(id) {
    const stored = ensureSeeded();
    const before = stored.communities.length;
    stored.communities = stored.communities.filter((c) => c.id !== id);
    if (stored.communities.length === before) {
      throw new Error("Community not found");
    }
    stored.featured = stored.featured.filter((f) => f.communityId !== id);
    stored.featuredCommunities = stored.featuredCommunities.filter(
      (row) => row.communityId !== id,
    );
    stored.top10Communities = stored.top10Communities.filter(
      (row) => row.communityId !== id,
    );
    stored.homepageHomes = stored.homepageHomes.filter(
      (row) => row.communityId !== id,
    );
    writeStored(stored);
  },

  async addHome(communityId, homeData) {
    const stored = ensureSeeded();
    const index = stored.communities.findIndex((c) => c.id === communityId);
    if (index === -1) throw new Error("Community not found");

    const home: Home = {
      ...homeData,
      id: crypto.randomUUID(),
      tags: homeData.tags ?? [],
      listingCategories: homeData.listingCategories ?? [],
      modelName: homeData.modelName ?? "",
      address: homeData.address ?? "",
    };
    stored.communities[index].homes.push(home);
    writeStored(stored);
    return home;
  },

  async updateHome(communityId, homeId, data) {
    const stored = ensureSeeded();
    const communityIndex = stored.communities.findIndex(
      (c) => c.id === communityId,
    );
    if (communityIndex === -1) throw new Error("Community not found");

    const homeIndex = stored.communities[communityIndex].homes.findIndex(
      (h) => h.id === homeId,
    );
    if (homeIndex === -1) throw new Error("Home not found");

    const updated: Home = {
      ...stored.communities[communityIndex].homes[homeIndex],
      ...data,
      id: homeId,
    };
    stored.communities[communityIndex].homes[homeIndex] = updated;
    writeStored(stored);
    return updated;
  },

  async deleteHome(communityId, homeId) {
    const stored = ensureSeeded();
    const communityIndex = stored.communities.findIndex(
      (c) => c.id === communityId,
    );
    if (communityIndex === -1) throw new Error("Community not found");

    const before = stored.communities[communityIndex].homes.length;
    stored.communities[communityIndex].homes = stored.communities[
      communityIndex
    ].homes.filter((h) => h.id !== homeId);
    if (stored.communities[communityIndex].homes.length === before) {
      throw new Error("Home not found");
    }
    writeStored(stored);
  },

  async getFeatured() {
    return sortFeatured(ensureSeeded().featured);
  },

  async addFeatured(data) {
    const stored = ensureSeeded();
    const item: FeaturedItem = {
      ...data,
      id: crypto.randomUUID(),
      order: stored.featured.length,
    };
    stored.featured.push(item);
    writeStored(stored);
    return item;
  },

  async updateFeatured(id, data) {
    const stored = ensureSeeded();
    const index = stored.featured.findIndex((f) => f.id === id);
    if (index === -1) throw new Error("Featured item not found");

    stored.featured[index] = { ...stored.featured[index], ...data, id };
    writeStored(stored);
    return stored.featured[index];
  },

  async deleteFeatured(id) {
    const stored = ensureSeeded();
    stored.featured = stored.featured.filter((f) => f.id !== id);
    stored.featured = stored.featured.map((f, i) => ({ ...f, order: i }));
    writeStored(stored);
  },

  async reorderFeatured(orderedIds) {
    const stored = ensureSeeded();
    const map = new Map(stored.featured.map((f) => [f.id, f]));
    stored.featured = orderedIds
      .map((id, index) => {
        const item = map.get(id);
        if (!item) return null;
        return { ...item, order: index };
      })
      .filter((f): f is FeaturedItem => f !== null);
    writeStored(stored);
    return stored.featured;
  },

  async getLenders() {
    return sortLenders(ensureSeeded().lenders);
  },

  async addLender(data) {
    const stored = ensureSeeded();
    const item: Lender = {
      ...data,
      id: crypto.randomUUID(),
      order: stored.lenders.length,
      imageUrl: data.imageUrl?.trim() || undefined,
    };
    stored.lenders.push(item);
    writeStored(stored);
    return item;
  },

  async updateLender(id, data) {
    const stored = ensureSeeded();
    const index = stored.lenders.findIndex((item) => item.id === id);
    if (index === -1) throw new Error("Lender not found");

    const updated: Lender = {
      ...stored.lenders[index],
      ...data,
      id,
      imageUrl:
        data.imageUrl !== undefined
          ? data.imageUrl.trim() || undefined
          : stored.lenders[index].imageUrl,
    };
    stored.lenders[index] = updated;
    writeStored(stored);
    return updated;
  },

  async deleteLender(id) {
    const stored = ensureSeeded();
    stored.lenders = stored.lenders.filter((item) => item.id !== id);
    stored.lenders = stored.lenders.map((item, i) => ({ ...item, order: i }));
    writeStored(stored);
  },

  async reorderLenders(orderedIds) {
    const stored = ensureSeeded();
    const map = new Map(stored.lenders.map((item) => [item.id, item]));
    stored.lenders = orderedIds
      .map((id, index) => {
        const item = map.get(id);
        if (!item) return null;
        return { ...item, order: index };
      })
      .filter((item): item is Lender => item !== null);
    writeStored(stored);
    return stored.lenders;
  },

  async getFeaturedCommunities() {
    return sortFeaturedCommunities(ensureSeeded().featuredCommunities);
  },

  async addFeaturedCommunity(communityId) {
    const stored = ensureSeeded();
    if (
      stored.featuredCommunities.some((row) => row.communityId === communityId)
    ) {
      throw new Error("Community is already in Featured Communities");
    }
    const community = stored.communities.find((c) => c.id === communityId);
    if (!community) throw new Error("Community not found");

    const item: FeaturedCommunityRow = {
      id: crypto.randomUUID(),
      communityId,
      order: stored.featuredCommunities.length,
    };
    stored.featuredCommunities.push(item);
    writeStored(stored);
    return item;
  },

  async removeFeaturedCommunity(id) {
    const stored = ensureSeeded();
    stored.featuredCommunities = stored.featuredCommunities.filter(
      (row) => row.id !== id,
    );
    stored.featuredCommunities = stored.featuredCommunities.map((row, i) => ({
      ...row,
      order: i,
    }));
    writeStored(stored);
  },

  async reorderFeaturedCommunities(orderedIds) {
    const stored = ensureSeeded();
    const map = new Map(stored.featuredCommunities.map((row) => [row.id, row]));
    stored.featuredCommunities = orderedIds
      .map((id, index) => {
        const item = map.get(id);
        if (!item) return null;
        return { ...item, order: index };
      })
      .filter((row): row is FeaturedCommunityRow => row !== null);
    writeStored(stored);
    return stored.featuredCommunities;
  },

  async getTop10Communities() {
    return sortTop10Slots(ensureSeeded().top10Communities);
  },

  async setTop10Slot(rank, communityId) {
    if (rank < 1 || rank > 10) {
      throw new Error("Rank must be between 1 and 10");
    }

    const stored = ensureSeeded();

    stored.top10Communities = stored.top10Communities.filter(
      (slot) => slot.rank !== rank,
    );

    if (communityId) {
      const community = stored.communities.find((item) => item.id === communityId);
      if (!community) throw new Error("Community not found");

      stored.top10Communities = stored.top10Communities.filter(
        (slot) => slot.communityId !== communityId,
      );

      stored.top10Communities.push({
        id: crypto.randomUUID(),
        communityId,
        rank,
      });
    }

    stored.top10Communities = sortTop10Slots(stored.top10Communities);
    writeStored(stored);
    return stored.top10Communities;
  },

  async importCsvCatalog(communitiesCsv, modelHomesCsv) {
    const stored = ensureSeeded();
    const result = importCatalogFromCsv(
      stored,
      communitiesCsv,
      modelHomesCsv,
    );
    writeStored(result.data);
    return result;
  },

  async getBuilders() {
    return ensureSeeded().builders;
  },

  async addBuilder(data) {
    const stored = ensureSeeded();
    const builder: Builder = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    stored.builders.push(builder);
    writeStored(stored);
    return builder;
  },

  async updateBuilder(id, data) {
    const stored = ensureSeeded();
    const index = stored.builders.findIndex((item) => item.id === id);
    if (index === -1) throw new Error("Builder not found");

    const updated: Builder = {
      ...stored.builders[index],
      ...data,
      id,
      createdAt: stored.builders[index].createdAt,
    };
    stored.builders[index] = updated;

    if (data.name) {
      stored.communities = stored.communities.map((community) =>
        communityHasBuilder(community, id)
          ? syncCommunityBuilderFields(community, stored.builders)
          : community,
      );
    }

    writeStored(stored);
    return updated;
  },

  async deleteBuilder(id) {
    const stored = ensureSeeded();
    const before = stored.builders.length;
    stored.builders = stored.builders.filter((item) => item.id !== id);
    if (stored.builders.length === before) {
      throw new Error("Builder not found");
    }

    const seriesToRemove = stored.series.filter((item) => item.builderId === id);
    for (const item of seriesToRemove) {
      removeSeriesFromCommunities(stored, item.id);
    }
    stored.series = stored.series.filter((item) => item.builderId !== id);
    stored.homepageSeries = stored.homepageSeries.filter(
      (row) => !seriesToRemove.some((item) => item.id === row.seriesId),
    );
    stored.communities = stored.communities.map((community) =>
      community.builderId === id
        ? { ...community, builderId: undefined }
        : community,
    );

    writeStored(stored);
  },

  async getSeries() {
    return ensureSeeded().series;
  },

  async addSeries(data) {
    const stored = ensureSeeded();
    if (!stored.builders.some((item) => item.id === data.builderId)) {
      throw new Error("Builder not found");
    }

    const item: Series = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    stored.series.push(item);
    writeStored(stored);
    return item;
  },

  async updateSeries(id, data) {
    const stored = ensureSeeded();
    const index = stored.series.findIndex((item) => item.id === id);
    if (index === -1) throw new Error("Series not found");

    if (data.builderId && !stored.builders.some((item) => item.id === data.builderId)) {
      throw new Error("Builder not found");
    }

    stored.series[index] = {
      ...stored.series[index],
      ...data,
      id,
      createdAt: stored.series[index].createdAt,
    };
    writeStored(stored);
    return stored.series[index];
  },

  async deleteSeries(id) {
    const stored = ensureSeeded();
    const before = stored.series.length;
    stored.series = stored.series.filter((item) => item.id !== id);
    if (stored.series.length === before) {
      throw new Error("Series not found");
    }

    removeSeriesFromCommunities(stored, id);
    stored.homepageSeries = stored.homepageSeries.filter(
      (row) => row.seriesId !== id,
    );
    writeStored(stored);
  },

  async addHomepageSeries(seriesId) {
    const stored = ensureSeeded();
    if (stored.homepageSeries.some((row) => row.seriesId === seriesId)) {
      throw new Error("Series is already on the homepage");
    }
    if (!stored.series.some((item) => item.id === seriesId)) {
      throw new Error("Series not found");
    }

    const item: HomepageSeriesRow = {
      id: crypto.randomUUID(),
      seriesId,
      order: stored.homepageSeries.length,
    };
    stored.homepageSeries.push(item);
    writeStored(stored);
    return item;
  },

  async removeHomepageSeries(id) {
    const stored = ensureSeeded();
    stored.homepageSeries = stored.homepageSeries.filter((row) => row.id !== id);
    stored.homepageSeries = stored.homepageSeries.map((row, i) => ({
      ...row,
      order: i,
    }));
    writeStored(stored);
  },

  async reorderHomepageSeries(orderedIds) {
    const stored = ensureSeeded();
    const map = new Map(stored.homepageSeries.map((row) => [row.id, row]));
    stored.homepageSeries = orderedIds
      .map((id, index) => {
        const item = map.get(id);
        if (!item) return null;
        return { ...item, order: index };
      })
      .filter((row): row is HomepageSeriesRow => row !== null);
    writeStored(stored);
    return stored.homepageSeries;
  },

  async addHomepageHomes(communityId) {
    const stored = ensureSeeded();
    if (stored.homepageHomes.some((row) => row.communityId === communityId)) {
      throw new Error("Community is already on the homepage");
    }
    const community = stored.communities.find((c) => c.id === communityId);
    if (!community) throw new Error("Community not found");

    const item: HomepageHomesRow = {
      id: crypto.randomUUID(),
      communityId,
      order: stored.homepageHomes.length,
    };
    stored.homepageHomes.push(item);
    writeStored(stored);
    return item;
  },

  async removeHomepageHomes(id) {
    const stored = ensureSeeded();
    stored.homepageHomes = stored.homepageHomes.filter((row) => row.id !== id);
    stored.homepageHomes = stored.homepageHomes.map((row, i) => ({
      ...row,
      order: i,
    }));
    writeStored(stored);
  },

  async reorderHomepageHomes(orderedIds) {
    const stored = ensureSeeded();
    const map = new Map(stored.homepageHomes.map((row) => [row.id, row]));
    stored.homepageHomes = orderedIds
      .map((id, index) => {
        const item = map.get(id);
        if (!item) return null;
        return { ...item, order: index };
      })
      .filter((row): row is HomepageHomesRow => row !== null);
    writeStored(stored);
    return stored.homepageHomes;
  },
};
