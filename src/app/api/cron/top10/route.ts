import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Top10Period } from "@/lib/types";

export const runtime = "nodejs";

const PERIODS: Top10Period[] = ["week", "month", "all-time"];

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET?.trim();

  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 500 },
    );
  }

  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Supabase admin client unavailable" },
      { status: 500 },
    );
  }

  const results: Record<string, number> = {};

  for (const period of PERIODS) {
    const { data, error } = await admin.rpc("compute_top10", {
      p_period: period,
    });
    if (error) {
      return NextResponse.json(
        { error: error.message, period },
        { status: 500 },
      );
    }
    results[period] = Number(data ?? 0);
  }

  return NextResponse.json({
    ok: true,
    inserted: results,
    computedAt: new Date().toISOString(),
  });
}
