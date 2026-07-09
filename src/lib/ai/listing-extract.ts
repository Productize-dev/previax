import type { CommunityInput, HomeInput, HomeTag } from "@/lib/types";

export type ExtractedListingDraft = {
  community?: Partial<CommunityInput> & {
    name?: string;
    city?: string;
    description?: string;
    amenities?: string[];
    tags?: string[];
    mainHighlight?: string;
    schoolDistrict?: string;
    youtubeUrl?: string;
  };
  homes?: Array<
    Partial<HomeInput> & {
      modelName?: string;
      description?: string;
      price?: number;
      bedrooms?: number;
      bathrooms?: number;
      sqft?: number;
      tags?: HomeTag[];
      highlights?: string[];
      youtubeUrl?: string;
    }
  >;
  source: "openai" | "anthropic" | "heuristic";
};

const HEURISTIC_PRICE = /(?:\$|USD\s*)([\d,]+(?:\.\d+)?)\s*(k|m)?/i;
const HEURISTIC_BEDS = /(\d+)\s*(?:bed|br|rec[aá]maras?)/i;
const HEURISTIC_BATHS = /(\d+(?:\.\d+)?)\s*(?:bath|baño)/i;
const HEURISTIC_SQFT = /([\d,]+)\s*(?:sq\.?\s*ft|sqft|pies)/i;

/** Extracción local sin API — útil como fallback. */
export function extractListingHeuristic(text: string): ExtractedListingDraft {
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const firstLine = lines[0] ?? "";
  const name = firstLine.length < 80 ? firstLine : "New community";
  const description = lines.slice(1, 6).join("\n") || text.slice(0, 500);

  const priceMatch = text.match(HEURISTIC_PRICE);
  let price = 0;
  if (priceMatch) {
    price = Number(priceMatch[1].replace(/,/g, ""));
    if (priceMatch[2]?.toLowerCase() === "k") price *= 1000;
    if (priceMatch[2]?.toLowerCase() === "m") price *= 1_000_000;
  }

  const beds = text.match(HEURISTIC_BEDS);
  const baths = text.match(HEURISTIC_BATHS);
  const sqft = text.match(HEURISTIC_SQFT);

  const amenities = lines
    .filter((l) => /^[-•*]/.test(l) || /pool|clubhouse|trail|park/i.test(l))
    .map((l) => l.replace(/^[-•*]\s*/, ""))
    .slice(0, 8);

  const tags: string[] = [];
  if (/luxury|lujo/i.test(text)) tags.push("luxury");
  if (/gated|privad/i.test(text)) tags.push("gated");
  if (/townhome|townhome/i.test(text)) tags.push("townhomes");
  if (/master[\s-]?planned/i.test(text)) tags.push("master-planned");

  return {
    community: {
      name,
      description,
      amenities,
      tags,
      mainHighlight: description.slice(0, 60),
    },
    homes: [
      {
        modelName: name,
        description,
        price,
        bedrooms: beds ? Number(beds[1]) : 0,
        bathrooms: baths ? Number(baths[1]) : 0,
        sqft: sqft ? Number(sqft[1].replace(/,/g, "")) : 0,
        tags: ["move-in-ready"],
        highlights: amenities.slice(0, 4),
      },
    ],
    source: "heuristic",
  };
}

export async function extractListingWithAi(
  text: string,
  url?: string,
): Promise<ExtractedListingDraft> {
  const key =
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.ANTHROPIC_API_KEY?.trim();

  if (!key) return extractListingHeuristic(text);

  const provider =
    process.env.AI_PROVIDER === "anthropic" && process.env.ANTHROPIC_API_KEY
      ? "anthropic"
      : "openai";

  const systemPrompt = `Extract a new-home community listing from brochure text. Return JSON only:
{
  "community": { "name", "city", "description", "mainHighlight", "amenities":[], "tags":[], "schoolDistrict", "youtubeUrl", "lenders":[] },
  "homes": [{ "modelName", "description", "price", "bedrooms", "bathrooms", "sqft", "tags":[], "highlights":[], "youtubeUrl" }]
}
Use English field values. Tags should be slug-like (e.g. master-planned, townhomes).`;

  const userContent = url
    ? `URL: ${url}\n\nContent:\n${text}`
    : text;

  try {
    if (provider === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": process.env.ANTHROPIC_API_KEY!,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2048,
          messages: [
            { role: "user", content: `${systemPrompt}\n\n${userContent}` },
          ],
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as {
        content?: Array<{ text?: string }>;
      };
      const raw = data.content?.[0]?.text ?? "";
      const json = raw.match(/\{[\s\S]*\}/)?.[0];
      if (!json) throw new Error("No JSON");
      return { ...JSON.parse(json), source: "anthropic" };
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      }),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) throw new Error("Empty response");
    return { ...JSON.parse(raw), source: "openai" };
  } catch {
    return extractListingHeuristic(text);
  }
}

export type ContentGenerateRequest = {
  type:
    | "community-description"
    | "community-highlights"
    | "community-tags"
    | "home-description"
    | "home-highlights"
    | "home-tags";
  context: Record<string, unknown>;
};

export async function generateContentWithAi(
  req: ContentGenerateRequest,
): Promise<{ result: string | string[]; source: "openai" | "anthropic" | "heuristic" }> {
  const { type, context } = req;
  const key = process.env.OPENAI_API_KEY?.trim();

  if (!key) {
    return { result: heuristicGenerate(type, context), source: "heuristic" };
  }

  const prompts: Record<ContentGenerateRequest["type"], string> = {
    "community-description": "Write a 2-3 sentence community description for a new home community.",
    "community-highlights": "Write one short main highlight (max 60 chars) for this community.",
    "community-tags": "Suggest 3-6 community tags as a JSON array of slug strings.",
    "home-description": "Write a 2 sentence model home description.",
    "home-highlights": "Suggest 4 bullet highlights as a JSON array of strings.",
    "home-tags": "Suggest home tags from: move-in-ready, under-construction, custom-build, patio-home, single-story, basement. Return JSON array.",
  };

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: `${prompts[type]} Return plain text for descriptions/highlights, JSON array for tags/highlights lists. Context: ${JSON.stringify(context)}`,
          },
          { role: "user", content: "Generate now." },
        ],
      }),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "";

    if (type.endsWith("tags") || type === "home-highlights") {
      const json = raw.match(/\[[\s\S]*\]/)?.[0];
      if (json) return { result: JSON.parse(json) as string[], source: "openai" };
    }
    return { result: raw.replace(/^["']|["']$/g, ""), source: "openai" };
  } catch {
    return { result: heuristicGenerate(type, context), source: "heuristic" };
  }
}

function heuristicGenerate(
  type: ContentGenerateRequest["type"],
  context: Record<string, unknown>,
): string | string[] {
  const name = String(context.name ?? "Community");
  const city = String(context.city ?? "");
  switch (type) {
    case "community-description":
      return `${name} in ${city} offers new construction homes with modern floor plans and community amenities.`;
    case "community-highlights":
      return `New homes in ${city}`.slice(0, 60);
    case "community-tags":
      return ["new-construction", "master-planned"];
    case "home-description":
      return `The ${context.modelName ?? "model"} features an open layout with quality finishes throughout.`;
    case "home-highlights":
      return ["Open-concept living", "Energy-efficient design", "Spacious primary suite"];
    case "home-tags":
      return ["move-in-ready"];
    default:
      return "";
  }
}
