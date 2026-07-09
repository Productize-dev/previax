import { NextResponse } from "next/server";

import {
  generateContentWithAi,
  type ContentGenerateRequest,
} from "@/lib/ai/listing-extract";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ContentGenerateRequest;
    if (!body.type || !body.context) {
      return NextResponse.json({ error: "type and context required" }, { status: 400 });
    }

    const result = await generateContentWithAi(body);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generate failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
