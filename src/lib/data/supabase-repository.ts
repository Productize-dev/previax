import { getSupabaseBrowserClient } from "../supabase/client";
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
  HomepageSeriesRow,
  Lender,
  LenderOffer,
  Series,
  Top10CommunitySlot,
  Top10Period,
} from "../types";
import type { SiteRepository } from "./repository";
import {
  builderInputToRow,
  builderToRow,
  communityInputToRow,
  communityToRow,
  featuredInputToRow,
  homeInputToRow,
  homeToRow,
  lenderInputToRow,
  lenderOfferInputToRow,
  rowToBuilder,
  rowToCommunity,
  rowToFeatured,
  rowToFeaturedCommunity,
  rowToHome,
  rowToHomepageSeries,
  rowToLender,
  rowToLenderOffer,
  rowToSeries,
  rowToTop10,
  rowsToTagLabels,
  seriesInputToRow,
  seriesToRow,
  tagLabelsToRows,
  type BuilderRow,
  type CommunityRow,
  type FeaturedCommunityRowRow,
  type FeaturedItemRow,
  type HomeRow,
  type HomepageSeriesRowRow,
  type LenderOfferRow,
  type LenderRow,
  type SeriesRow,
  type TagLabelRow,
  type Top10Row,
} from "./supabase-mappers";

function db() {
  return getSupabaseBrowserClient();
}

function fail(context: string, message: string): never {
  throw new Error(`${context}: ${message}`);
}

async function fetchCommunitiesWithHomes(): Promise<Community[]> {
  const [communitiesRes, homesRes] = await Promise.all([
    db()
      .from("communities")
      .select("*")
      .order("created_at", { ascending: true }),
    db()
      .from("homes")
      .select("*")
      .order("created_at", { ascending: true }),
  ]);
  if (communitiesRes.error) fail("Load communities", communitiesRes.error.message);
  if (homesRes.error) fail("Load homes", homesRes.error.message);

  const homesByCommunity = new Map<string, Home[]>();
  for (const row of (homesRes.data ?? []) as HomeRow[]) {
    const list = homesByCommunity.get(row.community_id) ?? [];
    list.push(rowToHome(row));
    homesByCommunity.set(row.community_id, list);
  }

  return ((communitiesRes.data ?? []) as CommunityRow[]).map((row) =>
    rowToCommunity(row, homesByCommunity.get(row.id) ?? []),
  );
}

async function fetchBuilders(): Promise<Builder[]> {
  const { data, error } = await db()
    .from("builders")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) fail("Load builders", error.message);
  return ((data ?? []) as BuilderRow[]).map(rowToBuilder);
}

async function fetchSeries(): Promise<Series[]> {
  const { data, error } = await db()
    .from("series")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) fail("Load series", error.message);
  return ((data ?? []) as SeriesRow[]).map(rowToSeries);
}

async function fetchFeatured(): Promise<FeaturedItem[]> {
  const { data, error } = await db()
    .from("featured_items")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) fail("Load featured", error.message);
  return ((data ?? []) as FeaturedItemRow[]).map(rowToFeatured);
}

async function fetchLenders(): Promise<Lender[]> {
  const { data, error } = await db()
    .from("lenders")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) fail("Load lenders", error.message);
  return ((data ?? []) as LenderRow[]).map(rowToLender);
}

async function fetchFeaturedCommunities(): Promise<FeaturedCommunityRow[]> {
  const { data, error } = await db()
    .from("featured_communities")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) fail("Load featured communities", error.message);
  return ((data ?? []) as FeaturedCommunityRowRow[]).map(rowToFeaturedCommunity);
}

async function fetchLenderOffers(): Promise<LenderOffer[]> {
  const { data, error } = await db()
    .from("lender_offers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) fail("Load lender offers", error.message);
  return ((data ?? []) as LenderOfferRow[]).map(rowToLenderOffer);
}

async function fetchTop10(
  period: Top10Period = "all-time",
): Promise<Top10CommunitySlot[]> {
  const { data, error } = await db()
    .from("top10_communities")
    .select("*")
    .eq("period", period)
    .order("rank", { ascending: true });
  if (error) fail("Load top 10", error.message);
  return ((data ?? []) as Top10Row[]).map(rowToTop10);
}

async function fetchHomepageSeries(): Promise<HomepageSeriesRow[]> {
  const { data, error } = await db()
    .from("homepage_series")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) fail("Load homepage series", error.message);
  return ((data ?? []) as HomepageSeriesRowRow[]).map(rowToHomepageSeries);
}

async function fetchTagLabels(): Promise<Record<string, string>> {
  const { data, error } = await db().from("community_tag_labels").select("*");
  if (error) fail("Load tag labels", error.message);
  return rowsToTagLabels((data ?? []) as TagLabelRow[]);
}

async function fetchAppData(): Promise<AppData> {
  const [
    communities,
    featured,
    lenders,
    lenderOffers,
    featuredCommunities,
    top10Communities,
    customCommunityTagLabels,
    builders,
    series,
    homepageSeries,
  ] = await Promise.all([
    fetchCommunitiesWithHomes(),
    fetchFeatured(),
    fetchLenders(),
    fetchLenderOffers(),
    fetchFeaturedCommunities(),
    fetchTop10(),
    fetchTagLabels(),
    fetchBuilders(),
    fetchSeries(),
    fetchHomepageSeries(),
  ]);

  return {
    communities,
    featured,
    lenders,
    lenderOffers,
    featuredCommunities,
    top10Communities,
    customCommunityTagLabels,
    builders,
    series,
    homepageSeries,
    homepageHomes: [],
  };
}

async function updateSortOrder(
  table: string,
  orderedIds: string[],
): Promise<void> {
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      db().from(table).update({ sort_order: index }).eq("id", id),
    ),
  );
  const firstError = results.find((res) => res.error)?.error;
  if (firstError) fail(`Reorder ${table}`, firstError.message);
}

export const supabaseRepository: SiteRepository = {
  async getAppData() {
    return fetchAppData();
  },

  async getAll() {
    return fetchCommunitiesWithHomes();
  },

  async getById(id) {
    const { data, error } = await db()
      .from("communities")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) fail("Load community", error.message);
    if (!data) return null;

    const homesRes = await db()
      .from("homes")
      .select("*")
      .eq("community_id", id)
      .order("created_at", { ascending: true });
    if (homesRes.error) fail("Load homes", homesRes.error.message);

    return rowToCommunity(
      data as CommunityRow,
      ((homesRes.data ?? []) as HomeRow[]).map(rowToHome),
    );
  },

  async create(data) {
    const { data: row, error } = await db()
      .from("communities")
      .insert({ ...communityInputToRow(data), tags: data.tags ?? [] })
      .select()
      .single();
    if (error) fail("Create community", error.message);
    return rowToCommunity(row as CommunityRow, []);
  },

  async update(id, data) {
    const { data: row, error } = await db()
      .from("communities")
      .update(communityInputToRow(data))
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) fail("Update community", error.message);
    if (!row) throw new Error("Community not found");

    const homesRes = await db()
      .from("homes")
      .select("*")
      .eq("community_id", id)
      .order("created_at", { ascending: true });
    if (homesRes.error) fail("Load homes", homesRes.error.message);

    return rowToCommunity(
      row as CommunityRow,
      ((homesRes.data ?? []) as HomeRow[]).map(rowToHome),
    );
  },

  async delete(id) {
    // FKs con on delete cascade limpian homes, featured, top10 y
    // featured_communities automáticamente.
    const { data, error } = await db()
      .from("communities")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) fail("Delete community", error.message);
    if (!data?.length) throw new Error("Community not found");
  },

  async addHome(communityId, homeData) {
    const { data: row, error } = await db()
      .from("homes")
      .insert({
        ...homeInputToRow({
          ...homeData,
          tags: homeData.tags ?? [],
          listingCategories: homeData.listingCategories ?? [],
          modelName: homeData.modelName ?? "",
          address: homeData.address ?? "",
        }),
        community_id: communityId,
      })
      .select()
      .single();
    if (error) fail("Add home", error.message);
    return rowToHome(row as HomeRow);
  },

  async updateHome(communityId, homeId, data) {
    const { data: row, error } = await db()
      .from("homes")
      .update(homeInputToRow(data))
      .eq("id", homeId)
      .eq("community_id", communityId)
      .select()
      .maybeSingle();
    if (error) fail("Update home", error.message);
    if (!row) throw new Error("Home not found");
    return rowToHome(row as HomeRow);
  },

  async deleteHome(communityId, homeId) {
    const { data, error } = await db()
      .from("homes")
      .delete()
      .eq("id", homeId)
      .eq("community_id", communityId)
      .select("id");
    if (error) fail("Delete home", error.message);
    if (!data?.length) throw new Error("Home not found");
  },

  async getFeatured() {
    return fetchFeatured();
  },

  async addFeatured(data) {
    const existing = await fetchFeatured();
    const { data: row, error } = await db()
      .from("featured_items")
      .insert({ ...featuredInputToRow(data), sort_order: existing.length })
      .select()
      .single();
    if (error) fail("Add featured", error.message);
    return rowToFeatured(row as FeaturedItemRow);
  },

  async updateFeatured(id, data) {
    const { data: row, error } = await db()
      .from("featured_items")
      .update(featuredInputToRow(data))
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) fail("Update featured", error.message);
    if (!row) throw new Error("Featured item not found");
    return rowToFeatured(row as FeaturedItemRow);
  },

  async deleteFeatured(id) {
    const { error } = await db().from("featured_items").delete().eq("id", id);
    if (error) fail("Delete featured", error.message);
    const remaining = await fetchFeatured();
    await updateSortOrder(
      "featured_items",
      remaining.map((item) => item.id),
    );
  },

  async reorderFeatured(orderedIds) {
    await updateSortOrder("featured_items", orderedIds);
    return fetchFeatured();
  },

  async getLenders() {
    return fetchLenders();
  },

  async addLender(data) {
    const existing = await fetchLenders();
    const { data: row, error } = await db()
      .from("lenders")
      .insert({ ...lenderInputToRow(data), sort_order: existing.length })
      .select()
      .single();
    if (error) fail("Add lender", error.message);
    return rowToLender(row as LenderRow);
  },

  async updateLender(id, data) {
    const { data: row, error } = await db()
      .from("lenders")
      .update(lenderInputToRow(data))
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) fail("Update lender", error.message);
    if (!row) throw new Error("Lender not found");
    return rowToLender(row as LenderRow);
  },

  async deleteLender(id) {
    const { error } = await db().from("lenders").delete().eq("id", id);
    if (error) fail("Delete lender", error.message);
    const remaining = await fetchLenders();
    await updateSortOrder(
      "lenders",
      remaining.map((item) => item.id),
    );
  },

  async reorderLenders(orderedIds) {
    await updateSortOrder("lenders", orderedIds);
    return fetchLenders();
  },

  async getLenderOffers() {
    return fetchLenderOffers();
  },

  async addLenderOffer(data) {
    const { data: row, error } = await db()
      .from("lender_offers")
      .insert(lenderOfferInputToRow(data))
      .select()
      .single();
    if (error) fail("Add lender offer", error.message);
    return rowToLenderOffer(row as LenderOfferRow);
  },

  async updateLenderOffer(id, data) {
    const { data: row, error } = await db()
      .from("lender_offers")
      .update(lenderOfferInputToRow(data))
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) fail("Update lender offer", error.message);
    if (!row) throw new Error("Lender offer not found");
    return rowToLenderOffer(row as LenderOfferRow);
  },

  async deleteLenderOffer(id) {
    const { data, error } = await db()
      .from("lender_offers")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) fail("Delete lender offer", error.message);
    if (!data?.length) throw new Error("Lender offer not found");
  },

  async getFeaturedCommunities() {
    return fetchFeaturedCommunities();
  },

  async addFeaturedCommunity(communityId) {
    const existing = await fetchFeaturedCommunities();
    if (existing.some((row) => row.communityId === communityId)) {
      throw new Error("Community is already in Featured Communities");
    }
    const { data: row, error } = await db()
      .from("featured_communities")
      .insert({ community_id: communityId, sort_order: existing.length })
      .select()
      .single();
    if (error) fail("Add featured community", error.message);
    return rowToFeaturedCommunity(row as FeaturedCommunityRowRow);
  },

  async removeFeaturedCommunity(id) {
    const { error } = await db()
      .from("featured_communities")
      .delete()
      .eq("id", id);
    if (error) fail("Remove featured community", error.message);
    const remaining = await fetchFeaturedCommunities();
    await updateSortOrder(
      "featured_communities",
      remaining.map((row) => row.id),
    );
  },

  async reorderFeaturedCommunities(orderedIds) {
    await updateSortOrder("featured_communities", orderedIds);
    return fetchFeaturedCommunities();
  },

  async getTop10Communities(period = "all-time") {
    return fetchTop10(period);
  },

  async setTop10Slot(rank, communityId, period = "all-time") {
    if (rank < 1 || rank > 10) {
      throw new Error("Rank must be between 1 and 10");
    }

    const clearRank = await db()
      .from("top10_communities")
      .delete()
      .eq("period", period)
      .eq("rank", rank);
    if (clearRank.error) fail("Set Top 10 slot", clearRank.error.message);

    if (communityId) {
      const clearCommunity = await db()
        .from("top10_communities")
        .delete()
        .eq("period", period)
        .eq("community_id", communityId);
      if (clearCommunity.error) {
        fail("Set Top 10 slot", clearCommunity.error.message);
      }

      const { error } = await db()
        .from("top10_communities")
        .insert({ community_id: communityId, rank, period });
      if (error) fail("Set Top 10 slot", error.message);
    }

    return sortTop10Slots(await fetchTop10(period));
  },

  async importCsvCatalog(communitiesCsv, modelHomesCsv, options) {
    const current = await fetchAppData();
    const result = importCatalogFromCsv(
      current,
      communitiesCsv,
      modelHomesCsv,
      options,
    );

    const currentBuilderIds = new Set(current.builders.map((b) => b.id));
    const currentSeriesIds = new Set(current.series.map((s) => s.id));
    const currentCommunityIds = new Set(current.communities.map((c) => c.id));
    const currentCommunityByKey = new Map(
      current.communities.map((c) => [
        `${c.name.trim().toLowerCase()}|${c.city.trim().toLowerCase()}`,
        c,
      ]),
    );

    const newBuilders = result.data.builders.filter(
      (b) => !currentBuilderIds.has(b.id),
    );
    const newSeries = result.data.series.filter(
      (s) => !currentSeriesIds.has(s.id),
    );

    const newCommunities = result.data.communities.filter(
      (c) => !currentCommunityIds.has(c.id),
    );
    const updatedCommunities = result.data.communities.filter((c) => {
      if (!currentCommunityIds.has(c.id)) return false;
      const key = `${c.name.trim().toLowerCase()}|${c.city.trim().toLowerCase()}`;
      const prev = currentCommunityByKey.get(key);
      return prev && prev.id === c.id;
    });

    if (newBuilders.length > 0) {
      const { error } = await db()
        .from("builders")
        .insert(newBuilders.map(builderToRow));
      if (error) fail("Import builders", error.message);
    }
    if (newSeries.length > 0) {
      const { error } = await db()
        .from("series")
        .insert(newSeries.map(seriesToRow));
      if (error) fail("Import series", error.message);
    }
    if (newCommunities.length > 0) {
      const { error } = await db()
        .from("communities")
        .insert(newCommunities.map(communityToRow));
      if (error) fail("Import communities", error.message);

      const homeRows = newCommunities.flatMap((community) =>
        community.homes.map((home) => homeToRow(home, community.id)),
      );
      if (homeRows.length > 0) {
        const homesError = (await db().from("homes").insert(homeRows)).error;
        if (homesError) fail("Import homes", homesError.message);
      }
    }

    for (const community of updatedCommunities) {
      const { error } = await db()
        .from("communities")
        .update(communityInputToRow(community))
        .eq("id", community.id);
      if (error) fail("Update community", error.message);

      for (const home of community.homes) {
        const existing = current.communities
          .find((c) => c.id === community.id)
          ?.homes.find((h) => h.id === home.id);

        if (existing) {
          const { error: homeError } = await db()
            .from("homes")
            .update(homeInputToRow(home))
            .eq("id", home.id);
          if (homeError) fail("Update home", homeError.message);
        } else {
          const { error: homeError } = await db()
            .from("homes")
            .insert(homeToRow(home, community.id));
          if (homeError) fail("Import home", homeError.message);
        }
      }
    }

    if (result.tagsAdded.length > 0) {
      const labels = result.data.customCommunityTagLabels ?? {};
      const rows = tagLabelsToRows(
        Object.fromEntries(
          result.tagsAdded
            .filter((slug) => labels[slug])
            .map((slug) => [slug, labels[slug]]),
        ),
      );
      if (rows.length > 0) {
        const { error } = await db()
          .from("community_tag_labels")
          .upsert(rows, { onConflict: "slug" });
        if (error) fail("Import tag labels", error.message);
      }
    }

    return result;
  },

  async getBuilders() {
    return fetchBuilders();
  },

  async addBuilder(data) {
    const { data: row, error } = await db()
      .from("builders")
      .insert(builderInputToRow(data))
      .select()
      .single();
    if (error) fail("Add builder", error.message);
    return rowToBuilder(row as BuilderRow);
  },

  async updateBuilder(id, data) {
    const { data: row, error } = await db()
      .from("builders")
      .update(builderInputToRow(data))
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) fail("Update builder", error.message);
    if (!row) throw new Error("Builder not found");
    const updated = rowToBuilder(row as BuilderRow);

    // Paridad con el repo local: si cambió el nombre, sincroniza el
    // builder_name denormalizado de las comunidades afectadas.
    if (data.name) {
      const [builders, communities] = await Promise.all([
        fetchBuilders(),
        fetchCommunitiesWithHomes(),
      ]);
      const affected = communities.filter((community) =>
        communityHasBuilder(community, id),
      );
      await Promise.all(
        affected.map((community) => {
          const synced = syncCommunityBuilderFields(community, builders);
          return db()
            .from("communities")
            .update({
              builder_name: synced.builderName,
              builder_id: synced.builderId ?? null,
              builder_ids: synced.builderIds ?? [],
            })
            .eq("id", community.id);
        }),
      );
    }

    return updated;
  },

  async deleteBuilder(id) {
    // FKs: series del builder se borran en cascada; homes.series_id y
    // communities.builder_id quedan en null automáticamente.
    const { data, error } = await db()
      .from("builders")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) fail("Delete builder", error.message);
    if (!data?.length) throw new Error("Builder not found");
  },

  async getSeries() {
    return fetchSeries();
  },

  async addSeries(data) {
    const { data: row, error } = await db()
      .from("series")
      .insert(seriesInputToRow(data))
      .select()
      .single();
    if (error) {
      if (error.code === "23503") throw new Error("Builder not found");
      fail("Add series", error.message);
    }
    return rowToSeries(row as SeriesRow);
  },

  async updateSeries(id, data) {
    const { data: row, error } = await db()
      .from("series")
      .update(seriesInputToRow(data))
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) {
      if (error.code === "23503") throw new Error("Builder not found");
      fail("Update series", error.message);
    }
    if (!row) throw new Error("Series not found");
    return rowToSeries(row as SeriesRow);
  },

  async deleteSeries(id) {
    // FKs: homepage_series se borra en cascada; homes.series_id -> null.
    const { data, error } = await db()
      .from("series")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) fail("Delete series", error.message);
    if (!data?.length) throw new Error("Series not found");
  },

  async addHomepageSeries(seriesId) {
    const existing = await fetchHomepageSeries();
    if (existing.some((row) => row.seriesId === seriesId)) {
      throw new Error("Series is already on the homepage");
    }
    const { data: row, error } = await db()
      .from("homepage_series")
      .insert({ series_id: seriesId, sort_order: existing.length })
      .select()
      .single();
    if (error) {
      if (error.code === "23503") throw new Error("Series not found");
      fail("Add homepage series", error.message);
    }
    return rowToHomepageSeries(row as HomepageSeriesRowRow);
  },

  async removeHomepageSeries(id) {
    const { error } = await db().from("homepage_series").delete().eq("id", id);
    if (error) fail("Remove homepage series", error.message);
    const remaining = await fetchHomepageSeries();
    await updateSortOrder(
      "homepage_series",
      remaining.map((row) => row.id),
    );
  },

  async reorderHomepageSeries(orderedIds) {
    await updateSortOrder("homepage_series", orderedIds);
    return fetchHomepageSeries();
  },

  // Deprecated homepage-homes API: la tabla ya no existe; se mantiene la
  // firma para no romper la interfaz, sin persistencia.
  async addHomepageHomes() {
    throw new Error("homepageHomes is deprecated — use addHomepageSeries");
  },

  async removeHomepageHomes() {
    // no-op: no hay filas homepage_homes en Supabase
  },

  async reorderHomepageHomes() {
    return [];
  },
};
