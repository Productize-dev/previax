/**
 * Seed de Supabase con la misma data de ejemplo que genera el
 * repositorio de localStorage (src/lib/seed-*.ts).
 *
 * Uso:
 *   npm run seed
 *
 * Requiere en .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Es idempotente: usa upsert por id, así que puede correrse varias veces.
 */
import { createClient } from "@supabase/supabase-js";

import { buildSeedAppData } from "../src/lib/seed-featured";
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
  top10ToRow,
} from "../src/lib/data/supabase-mappers";

try {
  process.loadEnvFile(".env.local");
} catch {
  // .env.local no existe; se asume que las vars ya están en el entorno.
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

async function upsert(table: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const { error } = await supabase
    .from(table)
    .upsert(rows, { onConflict: table === "community_tag_labels" ? "slug" : "id" });
  if (error) {
    throw new Error(`${table}: ${error.message}`);
  }
  console.log(`✓ ${table}: ${rows.length} fila(s)`);
}

async function main() {
  const data = buildSeedAppData();

  // Orden respetando FKs.
  await upsert("builders", data.builders.map(builderToRow));
  await upsert("series", data.series.map(seriesToRow));
  await upsert("communities", data.communities.map(communityToRow));
  await upsert(
    "homes",
    data.communities.flatMap((community) =>
      community.homes.map((home) => homeToRow(home, community.id)),
    ),
  );
  await upsert("lenders", data.lenders.map(lenderToRow));
  await upsert("featured_items", data.featured.map(featuredToRow));
  await upsert(
    "featured_communities",
    data.featuredCommunities.map(featuredCommunityToRow),
  );
  await upsert("top10_communities", data.top10Communities.map(top10ToRow));
  await upsert("homepage_series", data.homepageSeries.map(homepageSeriesToRow));
  await upsert(
    "community_tag_labels",
    tagLabelsToRows(data.customCommunityTagLabels ?? {}) as unknown as Record<
      string,
      unknown
    >[],
  );

  console.log("Seed completado.");
}

main().catch((err) => {
  console.error("Seed falló:", err instanceof Error ? err.message : err);
  process.exit(1);
});
