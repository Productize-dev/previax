import { NextResponse } from "next/server";

import {
  extractListingHeuristic,
  extractListingWithAi,
} from "@/lib/ai/listing-extract";

export const runtime = "nodejs";

type Body = {
  text?: string;
  url?: string;
};

async function fetchUrlText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "PreviaxBot/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return "";
    const html = await res.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 12000);
  } catch {
    return "";
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const url = body.url?.trim();
    let text = body.text?.trim() ?? "";

    if (url && !text) {
      text = await fetchUrlText(url);
    }
    if (!text && url) text = `Community listing at ${url}`;
    if (!text) {
      return NextResponse.json({ error: "text or url required" }, { status: 400 });
    }

    const draft = await extractListingWithAi(text, url);
    return NextResponse.json(draft);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Extract failed";
    return NextResponse.json(
      { ...extractListingHeuristic(""), error: message },
      { status: 500 },
    );
  }
}
