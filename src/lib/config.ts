/** Central inbox for all buyer inquiries — realtor contact info stays private */
export const CONTACT_EMAIL = "inquiries@previax.com";

/** Admin manager inbox for sales pipeline alerts (override via env). */
export const ADMIN_NOTIFY_EMAIL =
  process.env.ADMIN_NOTIFY_EMAIL ?? "productizecompany@gmail.com";

/** Optional Formspree endpoint — set NEXT_PUBLIC_FORMSPREE_URL in .env.local */
export const FORMSPREE_URL =
  process.env.NEXT_PUBLIC_FORMSPREE_URL ?? "";

/** Optional Calendly scheduling link (buyer tours) */
export const CALENDLY_URL =
  process.env.NEXT_PUBLIC_CALENDLY_URL ?? "";

/** Optional Calendly link for builder partnership meetings */
export const BUILDER_CALENDLY_URL =
  process.env.NEXT_PUBLIC_BUILDER_CALENDLY_URL || CALENDLY_URL;

/** Days a builder has to approve before auto-publish. */
export const BUILDER_APPROVAL_DAYS = 5;
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
