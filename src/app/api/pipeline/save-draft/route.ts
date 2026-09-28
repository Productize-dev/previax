import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/auth/server";
import { communityInputToRow } from "@/lib/data/supabase-mappers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { CommunityTag } from "@/lib/types";

export const runtime = "nodejs";

type SaveDraftBody = {
  communityId?: string;
  name?: string;
  city?: string;
  description?: string;
  thumbnailUrl?: string;
  builderId?: string;
  builderName?: string;
  builderIds?: string[];
  amenities?: string[];
  mainHighlight?: string;
  schoolDistrict?: string;
  tagline?: string;
  lifestyleNotes?: string;
  tags?: CommunityTag[];
};

/**
 * Sales/admin Step 1 draft create/update via service role.
 * Browser RLS inserts were failing (401 / policy violation) even for active
 * sales users; pipeline mutations already use this pattern.
 */
export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== "active") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (profile.role !== "sales" && profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Admin client unavailable" },
      { status: 500 },
    );
  }

  const body = (await request.json()) as SaveDraftBody;
  const name = body.name?.trim() ?? "";
  const city = body.city?.trim() ?? "";
  const description = body.description?.trim() ?? "";
  const builderId = body.builderId?.trim() ?? "";
  const tags = Array.isArray(body.tags) ? body.tags : [];

  if (!builderId) {
    return NextResponse.json({ error: "Select a builder" }, { status: 400 });
  }
  if (!name || !city || !description) {
    return NextResponse.json(
      { error: "Name, city, and description are required" },
      { status: 400 },
    );
  }
  if (tags.length === 0) {
    return NextResponse.json(
      { error: "Select at least one community tag" },
      { status: 400 },
    );
  }

  const builderIds =
    Array.isArray(body.builderIds) && body.builderIds.length > 0
      ? body.builderIds.filter(Boolean)
      : [builderId];

  const payload = communityInputToRow({
    name,
    city,
    description,
    thumbnailUrl: body.thumbnailUrl?.trim() ?? "",
    youtubeUrl: "",
    builderName: body.builderName?.trim() ?? "",
    builderId,
    builderIds,
    isMultiBuilder: false,
    builderOffers: "",
    realtorName: "",
    realtorPhone: "",
    realtorEmail: "",
    realtorPhotoUrl: "",
    amenities: Array.isArray(body.amenities) ? body.amenities : [],
    mainHighlight: body.mainHighlight?.trim() ?? "",
    schoolDistrict: body.schoolDistrict?.trim() ?? "",
    tagline: body.tagline?.trim() ?? "",
    lifestyleNotes: body.lifestyleNotes?.trim() ?? "",
    tags,
    isHidden: true,
    submittedBy: profile.id,
    ownerId: profile.id,
  });

  const communityId = body.communityId?.trim();

  if (communityId) {
    const { data: existing, error: loadError } = await admin
      .from("communities")
      .select("id, submitted_by, owner_id, pipeline_status")
      .eq("id", communityId)
      .maybeSingle();

    if (loadError || !existing) {
      return NextResponse.json(
        { error: loadError?.message ?? "Community not found" },
        { status: 404 },
      );
    }

    const isOwner =
      existing.submitted_by === profile.id || existing.owner_id === profile.id;
    if (profile.role === "sales" && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const status = (existing.pipeline_status as string) ?? "live";
    if (
      profile.role === "sales" &&
      !["draft", "awaiting_video", "video_review", "rejected"].includes(status)
    ) {
      return NextResponse.json(
        { error: `Cannot edit Step 1 from status ${status}` },
        { status: 400 },
      );
    }

    const { data: row, error } = await admin
      .from("communities")
      .update({
        ...payload,
        // Keep ownership stable on update; sales cannot reassign.
        submitted_by: existing.submitted_by ?? profile.id,
        owner_id: existing.owner_id ?? profile.id,
      })
      .eq("id", communityId)
      .select("id")
      .maybeSingle();

    if (error || !row) {
      return NextResponse.json(
        { error: error?.message ?? "Update failed" },
        { status: 500 },
      );
    }

    return NextResponse.json({ id: row.id as string });
  }

  const { data: row, error } = await admin
    .from("communities")
    .insert({
      ...payload,
      pipeline_status: "draft",
      tags,
      submitted_by: profile.id,
      owner_id: profile.id,
    })
    .select("id")
    .single();

  if (error || !row) {
    return NextResponse.json(
      { error: error?.message ?? "Create failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ id: row.id as string });
}
