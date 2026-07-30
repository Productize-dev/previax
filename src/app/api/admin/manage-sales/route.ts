import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/auth/server";
import {
  buildTokenHashConfirmUrl,
  siteOrigin,
} from "@/lib/auth/site-url";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { UserStatus } from "@/lib/types";

export const runtime = "nodejs";

type ManageBody = {
  userId?: string;
  action?:
    | "delete"
    | "suspend"
    | "activate"
    | "remove_sales"
    | "update"
    | "resend";
  fullName?: string;
};

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin" || profile.status !== "active") {
    return null;
  }
  return profile;
}

/** Admin-only: manage sales users (delete, suspend, activate, demote, rename, resend). */
export async function POST(request: Request) {
  const adminProfile = await requireAdmin();
  if (!adminProfile) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as ManageBody;
  const userId = body.userId?.trim();
  const action = body.action;
  if (!userId || !action) {
    return NextResponse.json(
      { error: "userId and action required" },
      { status: 400 },
    );
  }

  if (userId === adminProfile.id) {
    return NextResponse.json(
      { error: "You cannot change or delete your own account here" },
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

  const { data: target, error: loadError } = await admin
    .from("profiles")
    .select("id, role, status, email, full_name")
    .eq("id", userId)
    .maybeSingle();

  if (loadError || !target) {
    return NextResponse.json(
      { error: loadError?.message ?? "User not found" },
      { status: 404 },
    );
  }

  if (target.role !== "sales") {
    return NextResponse.json(
      { error: "This tool only manages sales users" },
      { status: 400 },
    );
  }

  if (action === "delete") {
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true, action: "delete", userId });
  }

  if (action === "suspend" || action === "activate") {
    const status: UserStatus =
      action === "suspend" ? "rejected" : "active";
    const { error } = await admin
      .from("profiles")
      .update({ status })
      .eq("id", userId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true, action, userId, status });
  }

  if (action === "remove_sales") {
    const { error } = await admin
      .from("profiles")
      .update({ role: "buyer", status: "active" })
      .eq("id", userId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true, action, userId });
  }

  if (action === "update") {
    const fullName = body.fullName?.trim();
    if (!fullName) {
      return NextResponse.json(
        { error: "fullName required" },
        { status: 400 },
      );
    }
    const { error } = await admin
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", userId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true, action, userId, fullName });
  }

  if (action === "resend") {
    const email = target.email?.trim().toLowerCase();
    if (!email) {
      return NextResponse.json(
        { error: "User has no email on file" },
        { status: 400 },
      );
    }
    const recovery = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${siteOrigin()}/set-password` },
    });
    const props = recovery.data?.properties;
    const hashedToken = props?.hashed_token;
    const verificationType = props?.verification_type || "recovery";
    if (recovery.error || !hashedToken) {
      return NextResponse.json(
        { error: recovery.error?.message ?? "Could not generate link" },
        { status: 400 },
      );
    }
    return NextResponse.json({
      ok: true,
      action,
      userId,
      actionLink: buildTokenHashConfirmUrl({
        tokenHash: hashedToken,
        type: verificationType,
        next: "/set-password",
      }),
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
