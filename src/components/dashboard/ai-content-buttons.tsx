"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { ContentGenerateRequest } from "@/lib/ai/listing-extract";

type AiContentButtonsProps = {
  type: ContentGenerateRequest["type"];
  context: Record<string, unknown>;
  onApply: (result: string | string[]) => void;
  disabled?: boolean;
};

const LABELS: Record<ContentGenerateRequest["type"], string> = {
  "community-description": "Generate description",
  "community-highlights": "Suggest highlight",
  "community-tags": "Suggest tags",
  "home-description": "Generate description",
  "home-highlights": "Suggest highlights",
  "home-tags": "Suggest tags",
};

export function AiContentButtons({
  type,
  context,
  onApply,
  disabled,
}: AiContentButtonsProps) {
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, context }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as { result: string | string[] };
      onApply(data.result);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled || loading}
      onClick={() => void handleGenerate()}
      className="gap-1.5"
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Sparkles className="size-3.5" />
      )}
      {LABELS[type]}
    </Button>
  );
}
