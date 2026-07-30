import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/auth/server";
import {
  buildTokenHashConfirmUrl,
  siteOrigin,
} from "@/lib/auth/site-url";
import { sendTransactionalEmail } from "@/lib/email";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type InviteBody = {
  email?: string;
  fullName?: string;
};

/**
 * Admin-only: invite a sales user by email.
 *
 * Uses generateLink + token_hash (not inviteUserByEmail's PKCE ?code= link),
 * so the invitee can open the link on any device and land on set-password.
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

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id, role")
    .eq("email", email)
    .maybeSingle();
  if (existingProfile?.role === "admin") {
    return NextResponse.json(
      {
        error:
          "That email belongs to an admin. Use a different email for sales.",
      },
      { status: 400 },
    );
  }

  const redirectTo = `${siteOrigin()}/set-password`;
  const meta = {
    full_name: body.fullName?.trim() || undefined,
    role: "buyer" as const,
  };

  let mode: "invite" | "existing" = "invite";
  let link = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { data: meta, redirectTo },
  });

  if (link.error || !link.data.user?.id) {
    mode = "existing";
    link = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });
  }

  if (link.error || !link.data.user?.id) {
    return NextResponse.json(
      {
        error:
          link.error?.message ?? "Could not create an invite for this email",
      },
      { status: 400 },
    );
  }

  const userId = link.data.user.id;
  const hashedToken = link.data.properties.hashed_token;
  const verificationType =
    link.data.properties.verification_type ||
    (mode === "invite" ? "invite" : "recovery");

  if (!hashedToken) {
    return NextResponse.json(
      { error: "Invite created without a token" },
      { status: 500 },
    );
  }

  const { data: targetProfile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (targetProfile?.role === "admin") {
    return NextResponse.json(
      {
        error:
          "That email belongs to an admin. Use a different email for sales.",
      },
      { status: 400 },
    );
  }

  const actionLink = buildTokenHashConfirmUrl({
    tokenHash: hashedToken,
    type: verificationType,
    next: "/set-password",
  });

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

  const emailResult = await sendTransactionalEmail({
    to: email,
    subject: "You're invited to Previax Sales",
    text: [
      "You've been invited to the Previax sales team.",
      "",
      "Open this link to activate your account and choose a password:",
      actionLink,
      "",
      "Do not use the normal Sign in page until you finish this step — you do not have a password yet.",
      "",
      `Link expires after a short time. Ask your admin to resend if needed.`,
    ].join("\n"),
    html: `
      <p>You've been invited to the <strong>Previax sales team</strong>.</p>
      <p><a href="${actionLink}">Activate your account &amp; set a password</a></p>
      <p style="color:#666;font-size:14px">Do not use Sign in until you finish this step — you do not have a password yet.</p>
    `,
  });

  return NextResponse.json({
    ok: true,
    userId,
    email,
    emailSent: !emailResult.skipped && emailResult.ok,
    emailSkipped: Boolean(emailResult.skipped),
    mode,
    actionLink,
  });
}
