/** Central inbox for all buyer inquiries — realtor contact info stays private */
export const CONTACT_EMAIL = "inquiries@previax.com";

/** Optional Formspree endpoint — set NEXT_PUBLIC_FORMSPREE_URL in .env.local */
export const FORMSPREE_URL =
  process.env.NEXT_PUBLIC_FORMSPREE_URL ?? "";

/** Optional Calendly scheduling link */
export const CALENDLY_URL =
  process.env.NEXT_PUBLIC_CALENDLY_URL ?? "";

export function buildContactMailto(
  communityName: string,
  realtorName: string,
): string {
  const subject = encodeURIComponent(
    `Inquiry: ${communityName} (Re: ${realtorName})`,
  );
  const body = encodeURIComponent(
    `Hi,\n\nI'm interested in learning more about ${communityName}.\n\n`,
  );
  return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}
