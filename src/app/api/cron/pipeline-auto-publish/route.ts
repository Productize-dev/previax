import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/** Auto-publish communities past the builder approval deadline. */
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

  const nowIso = new Date().toISOString();
  const { data: due, error } = await admin
    .from("communities")
    .select("id, name")
    .eq("pipeline_status", "pending_builder")
    .lt("builder_deadline_at", nowIso);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ids = (due ?? []).map((row) => row.id as string);
  if (ids.length === 0) {
    return NextResponse.json({ ok: true, published: 0 });
  }

  const { error: updateError } = await admin
    .from("communities")
    .update({
      pipeline_status: "live",
      is_hidden: false,
      builder_approved_at: nowIso,
    })
    .in("id", ids);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  for (const row of due ?? []) {
    await admin.rpc("notify_admins", {
      p_type: "pipeline_auto_publish",
      p_title: "Community auto-published",
      p_body: `${row.name} went live after the builder review window expired.`,
      p_community_id: row.id,
      p_href: "/dashboard?tab=pipeline",
    });
  }

  return NextResponse.json({
    ok: true,
    published: ids.length,
    ids,
    publishedAt: nowIso,
  });
}
