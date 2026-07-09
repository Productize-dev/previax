"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ExtractedListingDraft } from "@/lib/ai/listing-extract";

type AiPasteModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExtracted: (draft: ExtractedListingDraft) => void;
};

export function AiPasteModal({
  open,
  onOpenChange,
  onExtracted,
}: AiPasteModalProps) {
  const [tab, setTab] = useState<"paste" | "url">("paste");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleExtract() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/extract-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: tab === "paste" ? text : undefined,
          url: tab === "url" ? url : undefined,
        }),
      });
      if (!res.ok) throw new Error("Extraction failed");
      const draft = (await res.json()) as ExtractedListingDraft;
      onExtracted(draft);
      onOpenChange(false);
      setText("");
      setUrl("");
    } catch {
      setError("Could not extract listing. Try pasting more detail or check the URL.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading">
            <Sparkles className="size-5 text-primary" />
            Paste & autofill
          </DialogTitle>
          <DialogDescription>
            Paste brochure text or a listing URL. AI extracts a draft you can
            review in the form before saving.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={tab === "paste" ? "default" : "outline"}
            onClick={() => setTab("paste")}
          >
            Paste text
          </Button>
          <Button
            type="button"
            size="sm"
            variant={tab === "url" ? "default" : "outline"}
            onClick={() => setTab("url")}
          >
            From URL
          </Button>
        </div>

        {tab === "paste" ? (
          <div className="space-y-2">
            <Label htmlFor="paste-text">Brochure or listing text</Label>
            <Textarea
              id="paste-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              placeholder="Paste community description, amenities, model specs..."
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="paste-url">Listing URL</Label>
            <Input
              id="paste-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={loading || (tab === "paste" ? !text.trim() : !url.trim())}
            onClick={() => void handleExtract()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Extracting…
              </>
            ) : (
              "Extract & prefill"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
