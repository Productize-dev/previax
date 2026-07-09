"use client";

import { useEffect, useState } from "react";

import { AiContentButtons } from "@/components/dashboard/ai-content-buttons";
import { DuplicateWarning } from "@/components/dashboard/duplicate-warning";
import { ImageInput } from "@/components/dashboard/image-input";
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
import {
  communityToDashboardForm,
  newCommunityDashboardForm,
  toCommunityInput,
  type CommunityDashboardForm,
} from "@/lib/dashboard-defaults";
import { getAllCommunityTagOptions, getCommunityTagLabel } from "@/lib/tag-labels";
import { MAIN_HIGHLIGHT_MAX_LENGTH } from "@/lib/community-detail";
import {
  getYouTubeThumbnailUrl,
  isValidYouTubeUrl,
  isYouTubeThumbnailUrl,
  resolveThumbnailFromYouTube,
} from "@/lib/youtube";
import type { Community, CommunityTag } from "@/lib/types";
import type { DuplicateMatch } from "@/lib/duplicate-detection";
import { cn } from "@/lib/utils";
import { toastError, toastSuccess } from "@/lib/toast";

function linesToList(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

type CommunityFormProps = {
  editingCommunity: Community | null;
  defaultBuilderId?: string | null;
  lockBuilder?: boolean;
  onEditComplete: () => void;
  /** Cambia cuando se aplica un borrador IA para resetear el form. */
  prefillKey?: string;
  initialForm?: CommunityDashboardForm;
};

export function CommunityForm({
  editingCommunity,
  defaultBuilderId = null,
  lockBuilder = false,
  onEditComplete,
  prefillKey,
  initialForm,
}: CommunityFormProps) {
  const { builders, communities, customCommunityTagLabels, addCommunity, updateCommunity } =
    useDashboardData();
  const [form, setForm] = useState<CommunityDashboardForm>(() =>
    initialForm ??
      (editingCommunity
        ? communityToDashboardForm(editingCommunity)
        : newCommunityDashboardForm(defaultBuilderId ?? "")),
  );
  const [youtubeError, setYoutubeError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);

  useEffect(() => {
    if (initialForm) setForm(initialForm);
  }, [prefillKey, initialForm]);

  const isEditing = editingCommunity !== null;

  function updateField<K extends keyof CommunityDashboardForm>(
    field: K,
    value: CommunityDashboardForm[K],
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "youtubeUrl") setYoutubeError("");
  }

  function handleYoutubeUrlChange(url: string) {
    const autoThumbnail = getYouTubeThumbnailUrl(url);
    setForm((prev) => {
      const previousAuto = getYouTubeThumbnailUrl(prev.youtubeUrl);
      const shouldAutoFill =
        !prev.thumbnailUrl ||
        (previousAuto && prev.thumbnailUrl === previousAuto) ||
        isYouTubeThumbnailUrl(prev.thumbnailUrl);

      return {
        ...prev,
        youtubeUrl: url,
        thumbnailUrl:
          autoThumbnail && shouldAutoFill ? autoThumbnail : prev.thumbnailUrl,
      };
    });
    setYoutubeError("");
  }

  function handleThumbnailChange(url: string) {
    updateField("thumbnailUrl", url);
  }

  function toggleTag(tag: CommunityTag) {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  }

  function toggleBuilder(builderId: string) {
    setForm((prev) => {
      const nextIds = prev.builderIds.includes(builderId)
        ? prev.builderIds.filter((id) => id !== builderId)
        : [...prev.builderIds, builderId];
      return {
        ...prev,
        builderIds: nextIds,
        builderId: nextIds[0] ?? "",
      };
    });
  }

  function setCommunityType(communityType: "single" | "multi" | "none") {
    setForm((prev) => {
      if (communityType === "none") {
        return {
          ...prev,
          communityType,
          builderId: "",
          builderIds: [],
        };
      }

      if (communityType === "multi") {
        let builderIds =
          prev.communityType === "multi"
            ? prev.builderIds
            : prev.builderId
              ? [prev.builderId]
              : [];

        if (
          lockBuilder &&
          defaultBuilderId &&
          !builderIds.includes(defaultBuilderId)
        ) {
          builderIds = [...builderIds, defaultBuilderId];
        }

        return {
          ...prev,
          communityType,
          builderIds,
          builderId: builderIds[0] ?? "",
        };
      }

      return {
        ...prev,
        communityType,
        builderId: prev.builderIds[0] ?? prev.builderId,
        builderIds: prev.builderId ? [prev.builderId] : prev.builderIds.slice(0, 1),
      };
    });
  }

  const tagOptions = getAllCommunityTagOptions(
    communities,
    customCommunityTagLabels,
  );

  useEffect(() => {
    if (!form.name.trim() || form.name.length < 3) {
      setDuplicates([]);
      return;
    }
    const timer = setTimeout(() => {
      void fetch("/api/ai/check-duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "community",
          communities,
          name: form.name,
          city: form.city,
          excludeId: editingCommunity?.id,
        }),
      })
        .then((res) => res.json())
        .then((data: { matches?: DuplicateMatch[] }) =>
          setDuplicates(data.matches ?? []),
        )
        .catch(() => setDuplicates([]));
    }, 400);
    return () => clearTimeout(timer);
  }, [form.name, form.city, communities, editingCommunity?.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim()) {
      toastError("Community name is required");
      return;
    }
    if (!form.city.trim()) {
      toastError("City is required");
      return;
    }
    if (!form.description.trim()) {
      toastError("Description is required");
      return;
    }

    if (!isValidYouTubeUrl(form.youtubeUrl)) {
      setYoutubeError("Please enter a valid YouTube URL");
      toastError("Please enter a valid YouTube URL");
      return;
    }

    const thumbnailUrl = resolveThumbnailFromYouTube(
      form.youtubeUrl,
      form.thumbnailUrl,
    );

    if (!thumbnailUrl) {
      toastError("A thumbnail or valid YouTube URL is required");
      return;
    }

    const payload = {
      ...form,
      thumbnailUrl,
      mainHighlight: form.mainHighlight.trim(),
    };

    setSubmitting(true);
    try {
      if (isEditing) {
        const { homes: _homes, id, createdAt: _createdAt, ...existing } =
          editingCommunity;
        await updateCommunity(
          id,
          toCommunityInput(payload, existing, builders),
        );
        toastSuccess("Community updated");
        onEditComplete();
      } else {
        await addCommunity(toCommunityInput(payload, undefined, builders));
        toastSuccess("Community created");
      }
      setForm(newCommunityDashboardForm(defaultBuilderId ?? form.builderId));
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Could not save community");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl">
          {isEditing ? "Edit Community" : "Add Community"}
        </CardTitle>
        <CardDescription>
          Description, amenities, lenders, highlight, and tags. Homepage rows are
          built automatically from these fields.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>Community type</Label>
            <Select
              value={form.communityType}
              onValueChange={(value) =>
                setCommunityType(
                  (value as "single" | "multi" | "none") ?? "single",
                )
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select community type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single builder</SelectItem>
                <SelectItem value="multi">Multi-builder community</SelectItem>
                {!lockBuilder && (
                  <SelectItem value="none">No builder assigned</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {form.communityType === "single" ? (
            <div className="space-y-2">
              <Label>Builder</Label>
              <Select
                value={form.builderId}
                onValueChange={(value) => {
                  const builderId = value ?? "";
                  updateField("builderId", builderId);
                  updateField("builderIds", builderId ? [builderId] : []);
                }}
                disabled={lockBuilder}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a builder" />
                </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None yet</SelectItem>
                {builders.map((builder) => (
                    <SelectItem key={builder.id} value={builder.id}>
                      {builder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : form.communityType === "multi" ? (
            <div className="space-y-2">
              <Label>Builders</Label>
              <p className="text-xs text-muted-foreground">
                Optional — assign builders now or add them later.
              </p>
              <div className="flex flex-wrap gap-2">
                {builders.map((builder) => {
                  const selected = form.builderIds.includes(builder.id);

                  return (
                    <button
                      key={builder.id}
                      type="button"
                      onClick={() => {
                        if (
                          lockBuilder &&
                          builder.id === defaultBuilderId &&
                          form.builderIds.includes(builder.id)
                        ) {
                          return;
                        }
                        toggleBuilder(builder.id);
                      }}
                      className={cn(
                        "rounded-full border px-3 py-1 text-sm transition-colors",
                        selected
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border text-muted-foreground hover:border-primary/50",
                      )}
                    >
                      {builder.name}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {form.builderIds.length} builder
                {form.builderIds.length === 1 ? "" : "s"} selected
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              This community will not be linked to any builder.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Community name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="description">Description</Label>
              <AiContentButtons
                type="community-description"
                context={{ name: form.name, city: form.city, amenities: form.amenities }}
                onApply={(result) =>
                  updateField("description", String(result))
                }
              />
            </div>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="mainHighlight">Main highlight</Label>
              <AiContentButtons
                type="community-highlights"
                context={{ name: form.name, city: form.city, description: form.description }}
                onApply={(result) =>
                  updateField(
                    "mainHighlight",
                    String(result).slice(0, MAIN_HIGHLIGHT_MAX_LENGTH),
                  )
                }
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Short label shown on the community page (max{" "}
              {MAIN_HIGHLIGHT_MAX_LENGTH} characters).
            </p>
            <Textarea
              id="mainHighlight"
              value={form.mainHighlight}
              onChange={(e) =>
                updateField(
                  "mainHighlight",
                  e.target.value.slice(0, MAIN_HIGHLIGHT_MAX_LENGTH),
                )
              }
              rows={2}
              maxLength={MAIN_HIGHLIGHT_MAX_LENGTH}
              placeholder="Master-planned luxury"
            />
            <p className="text-xs text-muted-foreground text-right">
              {form.mainHighlight.length}/{MAIN_HIGHLIGHT_MAX_LENGTH}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amenities">Amenities (one per line)</Label>
            <Textarea
              id="amenities"
              value={form.amenities.join("\n")}
              onChange={(e) =>
                updateField("amenities", linesToList(e.target.value))
              }
              rows={4}
              placeholder="Pool & clubhouse"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lenders">Lenders (one per line)</Label>
            <Textarea
              id="lenders"
              value={form.lenders.join("\n")}
              onChange={(e) =>
                updateField("lenders", linesToList(e.target.value))
              }
              rows={3}
              placeholder="Preferred lender name"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Tags</Label>
              <AiContentButtons
                type="community-tags"
                context={{ name: form.name, description: form.description }}
                onApply={(result) => {
                  const tags = Array.isArray(result) ? result : [result];
                  setForm((prev) => ({
                    ...prev,
                    tags: [...new Set([...prev.tags, ...tags])],
                  }));
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Used to group communities on the homepage (e.g. Luxury, Gated).
            </p>
            <div className="flex flex-wrap gap-2">
              {tagOptions.map((tag) => {
                const selected = form.tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm transition-colors",
                      selected
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground hover:border-primary/50",
                    )}
                  >
                    {getCommunityTagLabel(tag, customCommunityTagLabels)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-border p-4 space-y-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Media (for homepage & video tours)
            </p>
            <div className="space-y-2">
              <Label htmlFor="youtubeUrl">YouTube URL</Label>
              <Input
                id="youtubeUrl"
                type="url"
                value={form.youtubeUrl}
                onChange={(e) => handleYoutubeUrlChange(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                required
              />
              <p className="text-xs text-muted-foreground">
                The video thumbnail is used automatically for homepage posters
                and the community page.
              </p>
              {youtubeError && (
                <p className="text-sm text-destructive">{youtubeError}</p>
              )}
            </div>
            <ImageInput
              id="thumbnailUrl"
              label="Custom thumbnail (optional)"
              hint="Leave blank to use the YouTube video thumbnail."
              value={form.thumbnailUrl}
              onChange={handleThumbnailChange}
            />
          </div>

          <DuplicateWarning matches={duplicates} />

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={submitting}>
              {isEditing ? "Save Changes" : "Add Community"}
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
