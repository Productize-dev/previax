import { NextResponse } from "next/server";

import {
  getAiProvider,
  resolveSmartSearch,
} from "@/lib/ai";
import type { AiSearchContext, AiSearchResult } from "@/lib/ai";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUniqueCities } from "@/lib/community-utils";
import type { Community } from "@/lib/types";

export const runtime = "nodejs";

type SearchBody = {
  query: string;
  context?: AiSearchContext;
  /** Catálogo ligero enviado por el cliente para filtrado sin round-trip extra. */
  communities?: Community[];
};

async function semanticMatchIds(
  embedding: number[],
  limit = 30,
): Promise<string[]> {
  const admin = createSupabaseAdminClient();
  const client = admin ?? (await createSupabaseServerClient());

  const { data, error } = await client.rpc("match_communities", {
    query_embedding: embedding,
    match_count: limit,
    similarity_threshold: 0.12,
  });

  if (error || !data) return [];
  return (data as Array<{ id: string }>).map((row) => row.id);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SearchBody;
    const query = body.query?.trim();
    if (!query) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    const catalog = body.communities ?? [];
    const knownCities = getUniqueCities(catalog);
    const context: AiSearchContext = {
      ...body.context,
      cities: body.context?.cities?.length
        ? body.context.cities
        : knownCities,
    };

    const provider = getAiProvider();
    const filters = await provider.parseSearch(query, context);

    let semanticIds: string[] = [];
    const embedText = filters.semanticQuery ?? query;
    const embedding = await provider.embed(embedText);
    if (embedding) {
      semanticIds = await semanticMatchIds(embedding);
    }

    if (embedding) {
      semanticIds = await semanticMatchIds(embedding);
    }

    const smart = resolveSmartSearch(catalog, filters, semanticIds);

    const result: AiSearchResult = {
      filters,
      semanticIds,
      source: provider.name,
      matchMode: smart.matchMode,
      exactCount: smart.exactCount,
    };

    return NextResponse.json({
      ...result,
      communityIds: smart.communityIds,
      total: smart.total,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
