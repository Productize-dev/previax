import { CONTACT_EMAIL } from "./config";
import type { GuidanceFormData } from "./types";

export function buildVisitMailto(opts: {
  communityName: string;
  homePrice?: number;
  name: string;
  email: string;
  phone: string;
  date: string;
  notes?: string;
}): string {
  const subject = encodeURIComponent(
    `Visit request: ${opts.communityName}${opts.homePrice ? ` — $${opts.homePrice.toLocaleString()}` : ""}`,
  );
  const body = encodeURIComponent(
    `Visit Request\n\nCommunity: ${opts.communityName}\n${opts.homePrice ? `Home price: $${opts.homePrice.toLocaleString()}\n` : ""}\nName: ${opts.name}\nEmail: ${opts.email}\nPhone: ${opts.phone}\nPreferred date: ${opts.date}\n${opts.notes ? `\nNotes: ${opts.notes}` : ""}`,
  );
  return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}

export function buildGuidanceMailto(data: GuidanceFormData): string {
  const subject = encodeURIComponent("Personalized community guidance request");
  const body = encodeURIComponent(
    `Guidance Request\n\nEmail: ${data.email}\nBudget: ${data.budget}\nPreferred cities: ${data.cities}\nTimeline: ${data.timeline}\n${data.notes ? `\nNotes: ${data.notes}` : ""}`,
  );
  return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}

export async function submitForm(
  endpoint: string | undefined,
  data: Record<string, string>,
): Promise<{ ok: boolean; via: "api" | "mailto"; mailto?: string }> {
  if (endpoint) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) return { ok: true, via: "api" };
    } catch {
      /* fall through to mailto */
    }
  }
  return { ok: false, via: "mailto" };
}
