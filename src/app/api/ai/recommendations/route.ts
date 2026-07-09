import { NextResponse } from "next/server";

import { buildRecommendationRows, getAiProvider } from "@/lib/ai";
import type { AiRecommendationsResult, AiSearchContext } from "@/lib/ai";
import type { Community } from "@/lib/types";

export const runtime = "nodejs";

type RecommendationsBody = {
  communities: Community[];
  context?: AiSearchContext;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RecommendationsBody;
    const catalog = body.communities ?? [];
    const context = body.context ?? {};

    const provider = getAiProvider();
    const rows = buildRecommendationRows(catalog, context);

    const result: AiRecommendationsResult = {
      rows,
      source: provider.name === "heuristic" ? "heuristic" : provider.name,
    };

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Recommendations failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
