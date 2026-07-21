import { NextResponse } from "next/server";

import {
  runAdminAssistant,
  type AssistantRequest,
} from "@/lib/ai/assistant";
import { getCurrentProfile } from "@/lib/auth/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin" || profile.status !== "active") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as AssistantRequest;
    const result = await runAdminAssistant(body);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Assistant failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
