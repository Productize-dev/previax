import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/auth/server";
import { ADMIN_NOTIFY_EMAIL, BUILDER_APPROVAL_DAYS } from "@/lib/config";
import { sendAdminEmail } from "@/lib/email";
import { builderDeadlineFrom } from "@/lib/sales-pipeline";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { CommunityPipelineStatus } from "@/lib/types";

export const runtime = "nodejs";

type ActionBody = {
  communityId?: string;
  action?:
    | "complete_step1"
    | "start_step2"
    | "submit_step2"
    | "admin_approve"
    | "admin_reject"
    | "builder_approve"
    | "builder_reject";
  rejectionReason?: string;
};

async function notifyAdmins(params: {
  type: string;
  title: string;
  body: string;
  communityId?: string;
  href?: string;
  emailSubject: string;
  emailText: string;
}) {
  const admin = createSupabaseAdminClient();
  if (admin) {
    await admin.rpc("notify_admins", {
      p_type: params.type,
      p_title: params.title,
      p_body: params.body,
      p_community_id: params.communityId ?? null,
      p_href: params.href ?? "/dashboard?tab=pipeline",
    });
  }

  await sendAdminEmail({
    to: ADMIN_NOTIFY_EMAIL,
    subject: params.emailSubject,
    text: params.emailText,
  });
}

export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== "active") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as ActionBody;
  const communityId = body.communityId?.trim();
  const action = body.action;
  if (!communityId || !action) {
    return NextResponse.json(
      { error: "communityId and action required" },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Admin client unavailable" },
      { status: 500 },
    );
  }

  const { data: row, error } = await admin
    .from("communities")
    .select("*")
    .eq("id", communityId)
    .maybeSingle();

  if (error || !row) {
    return NextResponse.json(
      { error: error?.message ?? "Community not found" },
      { status: 404 },
    );
  }

  const status = (row.pipeline_status as CommunityPipelineStatus) ?? "live";
  const isSalesOwner =
    profile.role === "sales" &&
    (row.submitted_by === profile.id || row.owner_id === profile.id);
  const isAdmin = profile.role === "admin";
  const isBuilder = profile.role === "builder";

  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  let patch: Record<string, unknown> | null = null;
  let afterNotify: (() => Promise<void>) | null = null;

  if (action === "complete_step1") {
    if (!isSalesOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!["draft", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: `Cannot complete step 1 from status ${status}` },
        { status: 400 },
      );
    }
    patch = {
      pipeline_status: "awaiting_video",
      step1_completed_at: nowIso,
      is_hidden: true,
      rejected_at: null,
      rejection_reason: null,
    };
    afterNotify = async () => {
      await notifyAdmins({
        type: "pipeline_step1",
        title: "Step 1 complete — community info ready",
        body: `${row.name} (${row.city}) is ready for video production.`,
        communityId,
        emailSubject: `[Previax] Step 1 complete: ${row.name}`,
        emailText: [
          `Sales completed Step 1 for "${row.name}" in ${row.city}.`,
          "",
          "Community information is ready for the video production team.",
          "YouTube video is not attached yet.",
          "",
          `Open dashboard: /dashboard?tab=pipeline`,
        ].join("\n"),
      });
    };
  } else if (action === "start_step2") {
    if (!isSalesOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (status !== "awaiting_video" && status !== "video_review") {
      return NextResponse.json(
        { error: `Cannot start step 2 from status ${status}` },
        { status: 400 },
      );
    }
    patch = { pipeline_status: "video_review", is_hidden: true };
  } else if (action === "submit_step2") {
    if (!isSalesOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!row.youtube_url?.trim()) {
      return NextResponse.json(
        { error: "YouTube URL required before submitting Step 2" },
        { status: 400 },
      );
    }
    if (!["video_review", "awaiting_video", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: `Cannot submit step 2 from status ${status}` },
        { status: 400 },
      );
    }
    patch = {
      pipeline_status: "pending_admin",
      step2_submitted_at: nowIso,
      is_hidden: true,
      rejected_at: null,
      rejection_reason: null,
    };
    afterNotify = async () => {
      await notifyAdmins({
        type: "pipeline_step2",
        title: "Step 2 submitted — ready for admin review",
        body: `${row.name} includes video and is waiting for admin approval.`,
        communityId,
        emailSubject: `[Previax] Step 2 submitted: ${row.name}`,
        emailText: [
          `Sales submitted Step 2 for "${row.name}".`,
          `YouTube: ${row.youtube_url}`,
          "",
          "Please review and approve in the admin pipeline.",
          "",
          `Open dashboard: /dashboard?tab=pipeline`,
        ].join("\n"),
      });
    };
  } else if (action === "admin_approve") {
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (status !== "pending_admin") {
      return NextResponse.json(
        { error: `Cannot admin-approve from status ${status}` },
        { status: 400 },
      );
    }
    const deadline = builderDeadlineFrom(now);
    patch = {
      pipeline_status: "pending_builder",
      admin_approved_at: nowIso,
      admin_approved_by: profile.id,
      builder_deadline_at: new Date(deadline).toISOString(),
      is_hidden: true,
    };
    afterNotify = async () => {
      // Notify builder owners via notifications table
      const builderIds: string[] = [];
      if (row.builder_id) builderIds.push(row.builder_id);
      if (Array.isArray(row.builder_ids)) {
        for (const id of row.builder_ids) {
          if (typeof id === "string") builderIds.push(id);
        }
      }
      if (builderIds.length > 0) {
        const { data: builders } = await admin
          .from("builders")
          .select("owner_id, name")
          .in("id", builderIds);
        const ownerIds = [
          ...new Set(
            (builders ?? [])
              .map((b) => b.owner_id as string | null)
              .filter((id): id is string => Boolean(id)),
          ),
        ];
        if (ownerIds.length > 0) {
          await admin.from("notifications").insert(
            ownerIds.map((userId) => ({
              user_id: userId,
              type: "pipeline_builder_review",
              title: "Community ready for your approval",
              body: `${row.name} was approved by admin. You have ${BUILDER_APPROVAL_DAYS} days to review.`,
              community_id: communityId,
              href: "/dashboard?tab=pipeline",
            })),
          );
        }
      }
    };
  } else if (action === "admin_reject") {
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    patch = {
      pipeline_status: "rejected",
      rejected_at: nowIso,
      rejection_reason: body.rejectionReason?.trim() || "Rejected by admin",
      is_hidden: true,
    };
  } else if (action === "builder_approve" || action === "builder_reject") {
    if (!isBuilder && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (status !== "pending_builder" && !isAdmin) {
      return NextResponse.json(
        { error: `Cannot builder-act from status ${status}` },
        { status: 400 },
      );
    }

    if (action === "builder_approve") {
      patch = {
        pipeline_status: "live",
        builder_approved_at: nowIso,
        is_hidden: false,
      };
    } else {
      patch = {
        pipeline_status: "rejected",
        rejected_at: nowIso,
        rejection_reason: body.rejectionReason?.trim() || "Rejected by builder",
        is_hidden: true,
      };
    }
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const { error: updateError } = await admin
    .from("communities")
    .update(patch)
    .eq("id", communityId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (afterNotify) await afterNotify();

  return NextResponse.json({ ok: true, communityId, action });
}
