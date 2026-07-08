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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useData } from "@/context/data-context";
import { getDefaultSeriesForCommunity } from "@/lib/catalog-utils";
import {
  homeToModelForm,
  newHomeModelForm,
  toHomeInput,
  type HomeModelForm,
} from "@/lib/dashboard-defaults";
import type { Home } from "@/lib/types";
import { isValidYouTubeUrl } from "@/lib/youtube";

type HomeFormProps = {
  editingHome: Home | null;
  editingCommunityId: string | null;
  communityIds?: string[];
  onEditComplete: () => void;
};

export function HomeForm({
  editingHome,
  editingCommunityId,
  communityIds,
  onEditComplete,
}: HomeFormProps) {
  const { communities, series, addHome, updateHome } = useData();
  const availableCommunities = communityIds?.length
    ? communities.filter((community) => communityIds.includes(community.id))
    : communities;
  const [communityId, setCommunityId] = useState(editingCommunityId ?? "");
  const [form, setForm] = useState<HomeModelForm>(() =>
    editingHome ? homeToModelForm(editingHome) : newHomeModelForm(),
  );
  const [youtubeError, setYoutubeError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isEditing = editingHome !== null && editingCommunityId !== null;

  function updateField<K extends keyof HomeModelForm>(
    field: K,
    value: HomeModelForm[K],
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "youtubeUrl") setYoutubeError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!communityId || !form.modelName.trim() || !form.description.trim()) {
      return;
    }

    if (form.youtubeUrl.trim() && !isValidYouTubeUrl(form.youtubeUrl)) {
      setYoutubeError("Please enter a valid YouTube URL");
      return;
    }

    const community = availableCommunities.find((c) => c.id === communityId);
    if (!community) return;

    const defaultSeries = getDefaultSeriesForCommunity(community, series);
    if (!defaultSeries) return;

    const imageUrls =
      editingHome?.imageUrls?.length
        ? editingHome.imageUrls
        : community.thumbnailUrl
          ? [community.thumbnailUrl]
          : [];

    const payload = toHomeInput(form, {
      seriesId: editingHome?.seriesId || defaultSeries.id,
      imageUrls,
      existing: editingHome ?? undefined,
    });

    setSubmitting(true);
    try {
      if (isEditing) {
        await updateHome(editingCommunityId, editingHome.id, payload);
        onEditComplete();
      } else {
        await addHome(communityId, payload);
      }
      setForm(newHomeModelForm());
      if (!isEditing) setCommunityId("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl">
          {isEditing ? "Edit Model Home" : "Add Model Home"}
        </CardTitle>
        <CardDescription>
          Name, description, and YouTube video for this floor plan model.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Community</Label>
            <Select
              value={communityId}
              onValueChange={(val) => setCommunityId(val ?? "")}
              disabled={isEditing}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a community" />
              </SelectTrigger>
              <SelectContent>
                {availableCommunities.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} — {c.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="modelName">Name</Label>
            <Input
              id="modelName"
              value={form.modelName}
              onChange={(e) => updateField("modelName", e.target.value)}
              placeholder="The Madison"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={4}
              placeholder="Short overview of this model home..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="youtubeUrl">YouTube URL</Label>
            <Input
              id="youtubeUrl"
              type="url"
              value={form.youtubeUrl}
              onChange={(e) => updateField("youtubeUrl", e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            {youtubeError && (
              <p className="text-sm text-destructive">{youtubeError}</p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              disabled={
                submitting ||
                !communityId ||
                !form.modelName.trim() ||
                !form.description.trim()
              }
            >
              {isEditing ? "Save Changes" : "Add Model Home"}
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
