/** Central inbox for all buyer inquiries — realtor contact info stays private */
export const CONTACT_EMAIL = "inquiries@previax.com";

/** Public Previax contact phone (digits only). */
export const CONTACT_PHONE = "3369053315";

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

/** Marketing landing hero background video. */
export const MARKETING_HERO_YOUTUBE_URL = "https://youtu.be/SbzPc5E7Ahw";

/** Days a builder has to approve before auto-publish. */
export const BUILDER_APPROVAL_DAYS = 5;

/** Format CONTACT_PHONE for display, e.g. (336) 905-3315. */
export function formatContactPhone(digits = CONTACT_PHONE): string {
  const d = digits.replace(/\D/g, "");
  if (d.length === 10) {
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }
  if (d.length === 11 && d.startsWith("1")) {
    return formatContactPhone(d.slice(1));
  }
  return digits;
}

export function contactPhoneTelHref(digits = CONTACT_PHONE): string {
  const d = digits.replace(/\D/g, "");
  return d ? `tel:+1${d.length === 11 && d.startsWith("1") ? d.slice(1) : d}` : `tel:${digits}`;
}

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
