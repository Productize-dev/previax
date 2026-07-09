import { getSupabaseBrowserClient } from "../supabase/client";
import { migrateAppData } from "../migrate";
import type { AppData } from "../types";
import {
  builderToRow,
  communityToRow,
  featuredCommunityToRow,
  featuredToRow,
  homeToRow,
  homepageSeriesToRow,
  lenderToRow,
  seriesToRow,
  tagLabelsToRows,
} from "./supabase-mappers";

const STORAGE_KEY = "previax-data";

export type LocalImportResult = {
  builders: number;
  series: number;
  communities: number;
  homes: number;
  lenders: number;
  featured: number;
  featuredCommunities: number;
  top10: number;
  homepageSeries: number;
  tagLabels: number;
};

/** Lee la data local ("previax-data") ya migrada, o null si no hay. */
export function readLocalAppData(): AppData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return migrateAppData({ communities: parsed });
    }
    return migrateAppData(parsed as Partial<AppData>);
  } catch {
    return null;
  }
}

async function upsert(
  table: string,
  rows: Record<string, unknown>[],
  onConflict = "id",
): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await getSupabaseBrowserClient()
    .from(table)
    .upsert(rows, { onConflict });
  if (error) {
    throw new Error(`${table}: ${error.message}`);
  }
}

/**
 * One-shot (Fase 1): sube la data de localStorage a Supabase preservando
 * los IDs existentes. Idempotente (upsert por id).
 */
export async function importLocalDataToCloud(
  data: AppData,
): Promise<LocalImportResult> {
  const supabase = getSupabaseBrowserClient();

  const builderIds = new Set(data.builders.map((b) => b.id));
  const seriesIds = new Set(data.series.map((s) => s.id));
  const communityIds = new Set(data.communities.map((c) => c.id));

  // Sanea referencias colgantes para no violar FKs.
  const communities = data.communities.map((community) => ({
    ...community,
    builderId:
      community.builderId && builderIds.has(community.builderId)
        ? community.builderId
        : undefined,
  }));
  const homes = communities.flatMap((community) =>
    community.homes.map((home) =>
      homeToRow(
        {
          ...home,
          seriesId:
            home.seriesId && seriesIds.has(home.seriesId) ? home.seriesId : "",
        },
        community.id,
      ),
    ),
  );
  const featured = data.featured.map((item) => ({
    ...item,
    communityId:
      item.communityId && communityIds.has(item.communityId)
        ? item.communityId
        : undefined,
  }));
  const featuredCommunities = data.featuredCommunities.filter((row) =>
    communityIds.has(row.communityId),
  );
  const top10 = data.top10Communities.filter((slot) =>
    communityIds.has(slot.communityId),
  );
  const homepageSeries = data.homepageSeries.filter((row) =>
    seriesIds.has(row.seriesId),
  );
  const tagLabels = tagLabelsToRows(data.customCommunityTagLabels ?? {});

  // Orden respetando FKs.
  await upsert("builders", data.builders.map(builderToRow));
  await upsert("series", data.series.map(seriesToRow));
  await upsert("communities", communities.map(communityToRow));
  await upsert("homes", homes);
  await upsert("lenders", data.lenders.map(lenderToRow));
  await upsert("featured_items", featured.map(featuredToRow));
  await upsert(
    "featured_communities",
    featuredCommunities.map(featuredCommunityToRow),
  );

  // Top 10: delete + insert para respetar unique(rank, period).
  if (top10.length > 0) {
    const ranks = top10.map((slot) => slot.rank);
    const clearByRank = await supabase
      .from("top10_communities")
      .delete()
      .eq("period", "all-time")
      .in("rank", ranks);
    if (clearByRank.error) {
      throw new Error(`top10_communities: ${clearByRank.error.message}`);
    }
    const clearById = await supabase
      .from("top10_communities")
      .delete()
      .in("id", top10.map((slot) => slot.id));
    if (clearById.error) {
      throw new Error(`top10_communities: ${clearById.error.message}`);
    }

    const insert = await supabase.from("top10_communities").insert(
      top10.map((slot) => ({
        id: slot.id,
        community_id: slot.communityId,
        rank: slot.rank,
        period: "all-time",
      })),
    );
    if (insert.error) {
      throw new Error(`top10_communities: ${insert.error.message}`);
    }
  }

  await upsert("homepage_series", homepageSeries.map(homepageSeriesToRow));
  await upsert(
    "community_tag_labels",
    tagLabels as unknown as Record<string, unknown>[],
    "slug",
  );

  return {
    builders: data.builders.length,
    series: data.series.length,
    communities: communities.length,
    homes: homes.length,
    lenders: data.lenders.length,
    featured: featured.length,
    featuredCommunities: featuredCommunities.length,
    top10: top10.length,
    homepageSeries: homepageSeries.length,
    tagLabels: tagLabels.length,
  };
}
