import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type InviteBody = {
  email?: string;
  fullName?: string;
};

function siteOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL.replace(/^https?:\/\//, "")}`
      : "http://localhost:3000");
  return raw.replace(/\/$/, "");
}

/**
 * Admin-only: invite a sales user by email.
 *
 * Best flow: admin invites → agent clicks the email link → sets a password.
 * They should NOT sign up first, and should NOT use Sign in until they finish
 * the invite link (they have no password yet).
 */
export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin" || profile.status !== "active") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as InviteBody;
  const email = body.email?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Admin client unavailable" },
      { status: 500 },
    );
  }

  const redirectTo = `${siteOrigin()}/auth/confirm?next=${encodeURIComponent("/set-password")}`;
  const meta = {
    full_name: body.fullName?.trim() || undefined,
    role: "buyer" as const, // signup trigger blocks self-serve sales/admin
  };

  let userId: string | undefined;
  let emailSent = false;
  let actionLink: string | undefined;
  let mode: "invite" | "existing" = "invite";

  const invite = await admin.auth.admin.inviteUserByEmail(email, {
    data: meta,
    redirectTo,
  });

  if (!invite.error && invite.data.user?.id) {
    userId = invite.data.user.id;
    emailSent = true;
  } else {
    // Already registered (or invite pending) — upgrade role + recovery link
    mode = "existing";
    const recovery = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });

    if (recovery.error || !recovery.data.user?.id) {
      return NextResponse.json(
        {
          error:
            invite.error?.message ??
            recovery.error?.message ??
            "Could not invite or recover this email",
        },
        { status: 400 },
      );
    }

    userId = recovery.data.user.id;
    actionLink = recovery.data.properties.action_link;
  }

  // Always provide a one-click link for the admin (email can be delayed / spam).
  if (!actionLink) {
    const magic = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });
    if (!magic.error) {
      actionLink = magic.data.properties.action_link;
    }
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      role: "sales",
      status: "active",
      full_name: body.fullName?.trim() || null,
      email,
    })
    .eq("id", userId);

  if (profileError) {
    return NextResponse.json(
      { error: profileError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    userId,
    email,
    emailSent,
    mode,
    actionLink,
  });
}
