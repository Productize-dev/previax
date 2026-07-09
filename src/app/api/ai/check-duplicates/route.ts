import { NextResponse } from "next/server";

import { findSimilarCommunities, findSimilarHomes } from "@/lib/duplicate-detection";
import type { Community } from "@/lib/types";

export const runtime = "nodejs";

type Body = {
  type: "community" | "home";
  communities: Community[];
  name: string;
  city?: string;
  communityId?: string;
  excludeId?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;

    if (body.type === "community") {
      const matches = findSimilarCommunities(
        body.communities,
        body.name,
        body.city ?? "",
        body.excludeId,
      );
      return NextResponse.json({ matches });
    }

    const community = body.communities.find((c) => c.id === body.communityId);
    if (!community) {
      return NextResponse.json({ matches: [] });
    }

    const matches = findSimilarHomes(
      community,
      body.name,
      body.excludeId,
    );
    return NextResponse.json({ matches });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Check failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
