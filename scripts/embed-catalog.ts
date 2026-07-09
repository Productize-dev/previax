/**
 * Backfill community embeddings for semantic search.
 * Requires OPENAI_API_KEY and SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Usage: npm run embed
 */
import { createClient } from "@supabase/supabase-js";

const EMBED_MODEL = "text-embedding-3-small";

function communityText(row: {
  name: string;
  city: string;
  description: string;
  builder_name: string;
  tags: string[] | null;
  school_district: string | null;
  amenities: string[] | null;
}): string {
  return [
    row.name,
    row.city,
    row.builder_name,
    row.description,
    row.school_district,
    ...(row.tags ?? []),
    ...(row.amenities ?? []),
  ]
    .filter(Boolean)
    .join(" · ");
}

async function embed(text: string, apiKey: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: EMBED_MODEL, input: text }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = (await res.json()) as {
    data?: Array<{ embedding?: number[] }>;
  };
  const vector = data.data?.[0]?.embedding;
  if (!vector) throw new Error("No embedding returned");
  return vector;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!url || !serviceKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  if (!openaiKey) {
    console.error("Missing OPENAI_API_KEY");
    process.exit(1);
  }

  const db = createClient(url, serviceKey);
  const { data: communities, error } = await db
    .from("communities")
    .select(
      "id, name, city, description, builder_name, tags, school_district, amenities, embedding",
    );

  if (error) throw error;
  if (!communities?.length) {
    console.log("No communities to embed.");
    return;
  }

  let updated = 0;
  for (const row of communities) {
    if (row.embedding) continue;
    const text = communityText(row);
    const vector = await embed(text, openaiKey);
    const { error: updateError } = await db
      .from("communities")
      .update({ embedding: vector })
      .eq("id", row.id);
    if (updateError) {
      console.error(`Failed ${row.id}:`, updateError.message);
      continue;
    }
    updated += 1;
    console.log(`Embedded: ${row.name}`);
  }

  console.log(`Done. ${updated} communities updated.`);
}

void main();
