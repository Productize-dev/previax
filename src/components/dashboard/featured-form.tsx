"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { isValidYouTubeUrl } from "@/lib/youtube";
import type { FeaturedItem, FeaturedItemInput } from "@/lib/types";

const emptyForm: FeaturedItemInput = {
  title: "",
  subtitle: "",
  youtubeUrl: "",
  communityId: undefined,
};

type FeaturedFormProps = {
  editingItem: FeaturedItem | null;
  onEditComplete: () => void;
};

export function FeaturedForm({ editingItem, onEditComplete }: FeaturedFormProps) {
  const { communities, addFeatured, updateFeatured } = useDashboardData();
  const [form, setForm] = useState<FeaturedItemInput>(
    editingItem
      ? {
          title: editingItem.title,
          subtitle: editingItem.subtitle,
          youtubeUrl: editingItem.youtubeUrl,
          communityId: editingItem.communityId,
        }
      : emptyForm,
  );
  const [youtubeError, setYoutubeError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isEditing = editingItem !== null;

  function updateField(field: keyof FeaturedItemInput, value: string) {
    setForm((prev) => ({ ...prev, [field]: value || undefined }));
    if (field === "youtubeUrl") setYoutubeError("");
  }

  function importFromCommunity(communityId: string) {
    const community = communities.find((c) => c.id === communityId);
    if (!community) return;
    setForm({
      title: community.name,
      subtitle: `${community.city}, North Carolina`,
      youtubeUrl: community.youtubeUrl,
      communityId: community.id,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isValidYouTubeUrl(form.youtubeUrl)) {
      setYoutubeError("Please enter a valid YouTube URL");
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing) {
        await updateFeatured(editingItem.id, form);
        onEditComplete();
      } else {
        await addFeatured(form);
      }
      setForm(emptyForm);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl">
          {isEditing ? "Edit Featured Slide" : "Add Featured Slide"}
        </CardTitle>
        <CardDescription>
          These appear in the homepage hero carousel. YouTube URL required.
          Rotates every 10 seconds.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Import from community (optional)</Label>
            <Select
              value={form.communityId ?? ""}
              onValueChange={(val) => {
                if (val) importFromCommunity(val);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a community to auto-fill" />
              </SelectTrigger>
              <SelectContent>
                {communities.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} — {c.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feat-title">Title</Label>
            <Input
              id="feat-title"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feat-subtitle">Subtitle</Label>
            <Input
              id="feat-subtitle"
              value={form.subtitle}
              onChange={(e) => updateField("subtitle", e.target.value)}
              placeholder="Raleigh, North Carolina"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feat-youtube">YouTube URL (required)</Label>
            <Input
              id="feat-youtube"
              type="url"
              value={form.youtubeUrl}
              onChange={(e) => updateField("youtubeUrl", e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              required
            />
            {youtubeError && (
              <p className="text-sm text-destructive">{youtubeError}</p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={submitting}>
              {isEditing ? "Save Slide" : "Add to Carousel"}
            </Button>
            {isEditing && (
              <Button type="button" variant="outline" onClick={onEditComplete}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
