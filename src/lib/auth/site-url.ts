/**
 * Canonical public origin for auth redirects and invite links.
 * Set NEXT_PUBLIC_SITE_URL in .env.local (e.g. http://localhost:3000).
 */
export function siteOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const vercel = process.env.NEXT_PUBLIC_VERCEL_URL?.trim();
  if (vercel) {
    return `https://${vercel.replace(/^https?:\/\//, "")}`.replace(/\/$/, "");
  }

  return "http://localhost:3000";
}

/** Build an invite/recovery link that uses token_hash (works without PKCE). */
export function buildTokenHashConfirmUrl(input: {
  tokenHash: string;
  type: string;
  next?: string;
}): string {
  const url = new URL("/auth/confirm", siteOrigin());
  url.searchParams.set("token_hash", input.tokenHash);
  url.searchParams.set("type", input.type);
  url.searchParams.set("next", input.next ?? "/set-password");
  return url.toString();
}
