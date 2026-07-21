"use client";

import { useEffect, useState } from "react";

import { AiContentButtons } from "@/components/dashboard/ai-content-buttons";
import { DuplicateWarning } from "@/components/dashboard/duplicate-warning";
import { MultiImageInput } from "@/components/dashboard/multi-image-input";
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
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { getDefaultSeriesForCommunity } from "@/lib/catalog-utils";
import {
  homeToModelForm,
  newHomeModelForm,
  toHomeInput,
  type HomeModelForm,
} from "@/lib/dashboard-defaults";
import type { Home, HomeTag } from "@/lib/types";
import type { DuplicateMatch } from "@/lib/duplicate-detection";
import {
  getYouTubeThumbnailUrl,
  isValidYouTubeUrl,
  isYouTubeThumbnailUrl,
} from "@/lib/youtube";
import { toastError, toastSuccess } from "@/lib/toast";

type HomeFormProps = {
  editingHome: Home | null;
  editingCommunityId: string | null;
  communityIds?: string[];
  onEditComplete: () => void;
  prefillKey?: string;
  initialForm?: HomeModelForm;
};

export function HomeForm({
  editingHome,
  editingCommunityId,
  communityIds,
  onEditComplete,
  prefillKey,
  initialForm,
}: HomeFormProps) {
  const { communities, series, addHome, updateHome } = useDashboardData();
  const availableCommunities = communityIds?.length
    ? communities.filter((community) => communityIds.includes(community.id))
    : communities;
  const [communityId, setCommunityId] = useState(editingCommunityId ?? "");
  const [form, setForm] = useState<HomeModelForm>(() =>
    initialForm ??
      (editingHome ? homeToModelForm(editingHome) : newHomeModelForm()),
  );
  const [youtubeError, setYoutubeError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);

  useEffect(() => {
    if (initialForm) setForm(initialForm);
  }, [prefillKey, initialForm]);

  const isEditing = editingHome !== null && editingCommunityId !== null;

  useEffect(() => {
    if (!form.modelName.trim() || !communityId) {
      setDuplicates([]);
      return;
    }
    const timer = setTimeout(() => {
      void fetch("/api/ai/check-duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "home",
          communities,
          name: form.modelName,
          communityId,
          excludeId: editingHome?.id,
        }),
      })
        .then((res) => res.json())
        .then((data: { matches?: DuplicateMatch[] }) =>
          setDuplicates(data.matches ?? []),
        )
        .catch(() => setDuplicates([]));
    }, 400);
    return () => clearTimeout(timer);
  }, [form.modelName, communityId, communities, editingHome?.id]);

  function updateField<K extends keyof HomeModelForm>(
    field: K,
    value: HomeModelForm[K],
  ) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "youtubeUrl" && typeof value === "string") {
        setYoutubeError("");
        const thumb = getYouTubeThumbnailUrl(value);
        if (!thumb || !isValidYouTubeUrl(value)) return next;

        const previousAuto = getYouTubeThumbnailUrl(prev.youtubeUrl);
        const cover = prev.imageUrls[0];
        const coverIsAuto =
          !cover ||
          (previousAuto != null && cover === previousAuto) ||
          isYouTubeThumbnailUrl(cover);

        if (coverIsAuto) {
          next.imageUrls = [thumb, ...prev.imageUrls.filter((u) => u !== cover && u !== thumb)];
        } else if (prev.imageUrls.length === 0) {
          next.imageUrls = [thumb];
        }
      }
      return next;
    });
    if (field === "youtubeUrl") setYoutubeError("");
  }

  function useYouTubeThumbnailAsCover() {
    const thumb = getYouTubeThumbnailUrl(form.youtubeUrl);
    if (!thumb || !isValidYouTubeUrl(form.youtubeUrl)) {
      setYoutubeError("Enter a valid YouTube URL first");
      return;
    }
    setForm((prev) => ({
      ...prev,
      imageUrls: [
        thumb,
        ...prev.imageUrls.filter(
          (url) => url !== thumb && !isYouTubeThumbnailUrl(url),
        ),
      ],
    }));
    setYoutubeError("");
  }

  const youtubeThumbPreview = isValidYouTubeUrl(form.youtubeUrl)
    ? getYouTubeThumbnailUrl(form.youtubeUrl)
    : null;
  const coverIsYouTube =
    form.imageUrls[0] != null && isYouTubeThumbnailUrl(form.imageUrls[0]);

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

    const youtubeCover = form.youtubeUrl.trim()
      ? getYouTubeThumbnailUrl(form.youtubeUrl)
      : null;

    const imageUrls =
      form.imageUrls.length > 0
        ? form.imageUrls
        : youtubeCover
          ? [youtubeCover]
          : editingHome?.imageUrls?.length
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
        toastSuccess("Model home updated");
        onEditComplete();
      } else {
        await addHome(communityId, payload);
        toastSuccess("Model home added");
      }
      setForm(newHomeModelForm());
      if (!isEditing) setCommunityId("");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Could not save model");
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
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="description">Description</Label>
              <AiContentButtons
                type="home-description"
                context={{
                  modelName: form.modelName,
                  bedrooms: form.bedrooms,
                  bathrooms: form.bathrooms,
                  sqft: form.sqft,
                }}
                onApply={(result) => updateField("description", String(result))}
              />
            </div>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={4}
              placeholder="Short overview of this model home..."
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                value={form.price || ""}
                onChange={(e) => updateField("price", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sqft">Sq ft</Label>
              <Input
                id="sqft"
                type="number"
                value={form.sqft || ""}
                onChange={(e) => updateField("sqft", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Input
                id="bedrooms"
                type="number"
                value={form.bedrooms || ""}
                onChange={(e) => updateField("bedrooms", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Input
                id="bathrooms"
                type="number"
                step="0.5"
                value={form.bathrooms || ""}
                onChange={(e) => updateField("bathrooms", Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Highlights</Label>
              <AiContentButtons
                type="home-highlights"
                context={{ modelName: form.modelName, description: form.description }}
                onApply={(result) => {
                  const items = Array.isArray(result) ? result : [String(result)];
                  updateField("highlights", items);
                }}
              />
            </div>
            <Textarea
              value={form.highlights.join("\n")}
              onChange={(e) =>
                updateField(
                  "highlights",
                  e.target.value.split("\n").map((l) => l.trim()).filter(Boolean),
                )
              }
              rows={3}
              placeholder="One highlight per line"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Tags</Label>
              <AiContentButtons
                type="home-tags"
                context={{ modelName: form.modelName, description: form.description }}
                onApply={(result) => {
                  const tags = (Array.isArray(result) ? result : [result]) as HomeTag[];
                  updateField("tags", [...new Set([...form.tags, ...tags])]);
                }}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-primary bg-primary/10 px-3 py-1 text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-3">
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
            {youtubeThumbPreview && (
              <div className="flex flex-wrap items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
                <img
                  src={youtubeThumbPreview}
                  alt="YouTube video thumbnail"
                  className="aspect-video w-40 rounded-md object-cover"
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {coverIsYouTube
                      ? "Cover photo is this YouTube thumbnail."
                      : "You can use this frame as the model cover photo."}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant={coverIsYouTube ? "outline" : "default"}
                    onClick={useYouTubeThumbnailAsCover}
                  >
                    {coverIsYouTube
                      ? "Refresh YouTube cover"
                      : "Use YouTube thumbnail as cover"}
                  </Button>
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Leave the gallery empty to auto-use the YouTube thumbnail, or click
              the button above to set it as cover anytime.
            </p>
          </div>

          <MultiImageInput
            label="Photo gallery"
            value={form.imageUrls}
            onChange={(urls) => updateField("imageUrls", urls)}
          />

          <DuplicateWarning matches={duplicates} />

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
