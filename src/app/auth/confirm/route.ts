import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * Email / invite landing. Prefer token_hash + type (no PKCE verifier needed).
 * Invite links from the admin API must use token_hash — a bare ?code= from a
 * server-side invite cannot be exchanged in the invitee's browser.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  const passwordTypes = new Set([
    "invite",
    "recovery",
    "magiclink",
    "email",
    "signup",
  ]);
  const defaultNext =
    type && passwordTypes.has(type) ? "/set-password" : "/";
  const next = searchParams.get("next") ?? defaultNext;
  const nextUrl = new URL(next, origin);

  const successRedirect = NextResponse.redirect(nextUrl);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            successRedirect.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) return successRedirect;
    console.error("[auth/confirm] verifyOtp failed", error.message);
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return successRedirect;
    console.error("[auth/confirm] exchangeCode failed", error.message);
  }

  return NextResponse.redirect(
    new URL("/login?error=confirm_failed", origin),
  );
}
