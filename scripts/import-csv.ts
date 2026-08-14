/**
 * Importa communities + model homes CSV a Supabase (mismo pipeline que el dashboard).
 *
 * Uso:
 *   npx tsx scripts/import-csv.ts [communities.csv] [models.csv]
 *
 * Defaults:
 *   data/import/comunidades-lennar-merged.csv
 *   data/import/modelos-lennar-merged.csv
 *
 * Requiere en .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

import { importCatalogFromCsv } from "../src/lib/csv-catalog-import";
import { buildDefaultHomepageSections } from "../src/lib/homepage-layout";
import {
  builderToRow,
  communityInputToRow,
  communityToRow,
  homeInputToRow,
  homeToRow,
  rowToBuilder,
  rowToCommunity,
  rowToHome,
  rowToSeries,
  rowsToTagLabels,
  seriesToRow,
  tagLabelsToRows,
  type BuilderRow,
  type CommunityRow,
  type HomeRow,
  type SeriesRow,
  type TagLabelRow,
} from "../src/lib/data/supabase-mappers";
import type { AppData, Home } from "../src/lib/types";

try {
  process.loadEnvFile(".env.local");
} catch {
  // vars already in env
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false },
});

function fail(context: string, message: string): never {
  throw new Error(`${context}: ${message}`);
}

async function loadCurrentAppData(): Promise<AppData> {
  const [communitiesRes, homesRes, buildersRes, seriesRes, tagsRes] =
    await Promise.all([
      supabase.from("communities").select("*").order("created_at", {
        ascending: true,
      }),
      supabase.from("homes").select("*").order("created_at", { ascending: true }),
      supabase.from("builders").select("*").order("created_at", {
        ascending: true,
      }),
      supabase.from("series").select("*").order("created_at", { ascending: true }),
      supabase.from("community_tag_labels").select("*"),
    ]);

  if (communitiesRes.error) fail("Load communities", communitiesRes.error.message);
  if (homesRes.error) fail("Load homes", homesRes.error.message);
  if (buildersRes.error) fail("Load builders", buildersRes.error.message);
  if (seriesRes.error) fail("Load series", seriesRes.error.message);
  if (tagsRes.error) fail("Load tags", tagsRes.error.message);

  const homesByCommunity = new Map<string, Home[]>();
  for (const row of (homesRes.data ?? []) as HomeRow[]) {
    const list = homesByCommunity.get(row.community_id) ?? [];
    list.push(rowToHome(row));
    homesByCommunity.set(row.community_id, list);
  }

  const communities = ((communitiesRes.data ?? []) as CommunityRow[]).map(
    (row) => rowToCommunity(row, homesByCommunity.get(row.id) ?? []),
  );

  return {
    communities,
    apartmentCommunities: [],
    builders: ((buildersRes.data ?? []) as BuilderRow[]).map(rowToBuilder),
    series: ((seriesRes.data ?? []) as SeriesRow[]).map(rowToSeries),
    featured: [],
    lenders: [],
    lenderOffers: [],
    featuredCommunities: [],
    top10Communities: [],
    customCommunityTagLabels: rowsToTagLabels(
      (tagsRes.data ?? []) as TagLabelRow[],
    ),
    homepageSeries: [],
    homepageHomes: [],
    homepageSections: buildDefaultHomepageSections(),
  };
}

async function writeImportResult(
  current: AppData,
  result: ReturnType<typeof importCatalogFromCsv>,
) {
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
    const { error } = await supabase
      .from("builders")
      .insert(newBuilders.map(builderToRow));
    if (error) fail("Import builders", error.message);
    console.log(`✓ builders insert: ${newBuilders.length}`);
  }

  if (newSeries.length > 0) {
    const { error } = await supabase
      .from("series")
      .insert(newSeries.map(seriesToRow));
    if (error) fail("Import series", error.message);
    console.log(`✓ series insert: ${newSeries.length}`);
  }

  if (newCommunities.length > 0) {
    const { error } = await supabase
      .from("communities")
      .insert(newCommunities.map(communityToRow));
    if (error) fail("Import communities", error.message);
    console.log(`✓ communities insert: ${newCommunities.length}`);

    const homeRows = newCommunities.flatMap((community) =>
      community.homes.map((home) => homeToRow(home, community.id)),
    );
    if (homeRows.length > 0) {
      const { error: homesError } = await supabase.from("homes").insert(homeRows);
      if (homesError) fail("Import homes", homesError.message);
      console.log(`✓ homes insert (new communities): ${homeRows.length}`);
    }
  }

  for (const community of updatedCommunities) {
    const { error } = await supabase
      .from("communities")
      .update(communityInputToRow(community))
      .eq("id", community.id);
    if (error) fail("Update community", error.message);

    for (const home of community.homes) {
      const existing = current.communities
        .find((c) => c.id === community.id)
        ?.homes.find((h) => h.id === home.id);

      if (existing) {
        const { error: homeError } = await supabase
          .from("homes")
          .update(homeInputToRow(home))
          .eq("id", home.id);
        if (homeError) fail("Update home", homeError.message);
      } else {
        const { error: homeError } = await supabase
          .from("homes")
          .insert(homeToRow(home, community.id));
        if (homeError) fail("Import home", homeError.message);
      }
    }
  }

  if (updatedCommunities.length > 0) {
    console.log(`✓ communities updated: ${updatedCommunities.length}`);
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
      const { error } = await supabase
        .from("community_tag_labels")
        .upsert(rows, { onConflict: "slug" });
      if (error) fail("Import tag labels", error.message);
      console.log(`✓ tag labels upsert: ${rows.length}`);
    }
  }
}

async function main() {
  const communitiesPath = resolve(
    process.argv[2] ?? "data/import/comunidades-lennar-merged.csv",
  );
  const modelsPath = resolve(
    process.argv[3] ?? "data/import/modelos-lennar-merged.csv",
  );

  const communitiesCsv = readFileSync(communitiesPath, "utf8");
  const modelsCsv = readFileSync(modelsPath, "utf8");

  console.log(`Communities CSV: ${communitiesPath}`);
  console.log(`Models CSV:      ${modelsPath}`);

  const current = await loadCurrentAppData();
  console.log(
    `Estado actual: ${current.communities.length} communities, ${current.communities.reduce((n, c) => n + c.homes.length, 0)} homes`,
  );

  const result = importCatalogFromCsv(current, communitiesCsv, modelsCsv, {
    mode: "upsert",
    skipErrorRows: true,
  });

  console.log(
    `Preview: +${result.communitiesAdded} / ~${result.communitiesUpdated} communities, +${result.homesAdded} / ~${result.homesUpdated} homes, +${result.buildersAdded} builders`,
  );

  await writeImportResult(current, result);

  console.log("Import completado.");
}

main().catch((err) => {
  console.error("Import falló:", err instanceof Error ? err.message : err);
  process.exit(1);
});
