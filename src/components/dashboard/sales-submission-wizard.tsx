"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import { AiContentButtons } from "@/components/dashboard/ai-content-buttons";
import { AiPasteModal } from "@/components/dashboard/ai-paste-modal";
import { Button } from "@/components/ui/button";
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
import { useProfile } from "@/context/auth-context";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import type { ExtractedListingDraft } from "@/lib/ai/listing-extract";
import { DEFAULT_NEW_COMMUNITY_TAGS } from "@/lib/dashboard-defaults";
import { draftToCommunityForm } from "@/lib/listing-draft";
import {
  getAllCommunityTagOptions,
  getCommunityTagLabel,
} from "@/lib/tag-labels";
import { toastError, toastSuccess } from "@/lib/toast";
import type { CommunityTag } from "@/lib/types";
import { cn } from "@/lib/utils";

type SalesSubmissionWizardProps = {
  onStep1Complete?: (communityId: string) => void;
};

/** Step 1 only: community info + tags. Video is handled later in My pipeline. */
export function SalesSubmissionWizard({
  onStep1Complete,
}: SalesSubmissionWizardProps) {
  const profile = useProfile();
  const {
    builders,
    communities,
    customCommunityTagLabels,
    addCommunity,
    updateCommunity,
    refresh,
  } = useDashboardData();
  const [pasteOpen, setPasteOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [builderId, setBuilderId] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [amenities, setAmenities] = useState("");
  const [mainHighlight, setMainHighlight] = useState("");
  const [schoolDistrict, setSchoolDistrict] = useState("");
  const [tagline, setTagline] = useState("");
  const [lifestyleNotes, setLifestyleNotes] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [tags, setTags] = useState<CommunityTag[]>([
    ...DEFAULT_NEW_COMMUNITY_TAGS,
  ]);
  const [communityId, setCommunityId] = useState<string | null>(null);

  const tagOptions = getAllCommunityTagOptions(
    communities,
    customCommunityTagLabels,
  );

  function toggleTag(tag: CommunityTag) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  function resetForm() {
    setBuilderId("");
    setName("");
    setCity("");
    setDescription("");
    setAmenities("");
    setMainHighlight("");
    setSchoolDistrict("");
    setTagline("");
    setLifestyleNotes("");
    setThumbnailUrl("");
    setTags([...DEFAULT_NEW_COMMUNITY_TAGS]);
    setCommunityId(null);
  }

  function applyDraft(draft: ExtractedListingDraft) {
    const form = draftToCommunityForm(draft, builderId || builders[0]?.id || "");
    const community = draft.community;
    setName(form.name);
    setCity(form.city);
    setDescription(form.description);
    setAmenities((form.amenities ?? []).join("\n"));
    setMainHighlight(form.mainHighlight);
    setSchoolDistrict(community?.schoolDistrict?.trim() ?? "");
    setTagline(community?.tagline?.trim() ?? "");
    setLifestyleNotes(community?.lifestyleNotes?.trim() ?? "");
    const thumb =
      community?.thumbnailUrl?.trim() || form.thumbnailUrl.trim() || "";
    if (thumb) setThumbnailUrl(thumb);
    if (form.tags.length > 0) {
      setTags([...new Set(form.tags)]);
    }

    const builderName = community?.builderName?.trim().toLowerCase();
    if (builderName) {
      const matched = builders.find(
        (b) =>
          b.name.trim().toLowerCase() === builderName ||
          b.name.trim().toLowerCase().includes(builderName) ||
          builderName.includes(b.name.trim().toLowerCase()),
      );
      if (matched) setBuilderId(matched.id);
      else if (form.builderId) setBuilderId(form.builderId);
    } else if (form.builderId) {
      setBuilderId(form.builderId);
    }

    toastSuccess(
      draft.organized
        ? "AI organized the listing into Step 1 fields — review before submitting"
        : "Draft loaded — review every field before completing Step 1",
    );
  }

  async function saveDraft(completeStep1: boolean) {
    if (!profile) return;
    if (!builderId) {
      toastError("Select a builder");
      return;
    }
    if (!name.trim() || !city.trim() || !description.trim()) {
      toastError("Name, city, and description are required");
      return;
    }
    if (tags.length === 0) {
      toastError("Select at least one community tag");
      return;
    }

    const builder = builders.find((b) => b.id === builderId);
    setBusy(true);
    try {
      const basePayload = {
        name: name.trim(),
        city: city.trim(),
        description: description.trim(),
        thumbnailUrl: thumbnailUrl.trim(),
        builderName: builder?.name ?? "",
        builderId,
        builderIds: [builderId],
        isMultiBuilder: false,
        builderOffers: "",
        realtorName: "",
        realtorPhone: "",
        realtorEmail: "",
        realtorPhotoUrl: "",
        amenities: amenities
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
        mainHighlight: mainHighlight.trim(),
        schoolDistrict: schoolDistrict.trim(),
        tagline: tagline.trim(),
        lifestyleNotes: lifestyleNotes.trim(),
        tags,
        isHidden: true,
        submittedBy: profile.id,
        ownerId: profile.id,
      };

      let id = communityId;
      if (id) {
        await updateCommunity(id, basePayload);
      } else {
        const created = await addCommunity({
          ...basePayload,
          youtubeUrl: "",
          pipelineStatus: "draft",
        });
        id = created.id;
        setCommunityId(created.id);
      }

      if (completeStep1) {
        const res = await fetch("/api/pipeline/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            communityId: id,
            action: "complete_step1",
          }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Step 1 failed");
        toastSuccess("Step 1 complete — continue in My pipeline when video is ready");
        await refresh();
        resetForm();
        onStep1Complete?.(id);
        return;
      }

      toastSuccess("Draft saved");
      await refresh();
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 rounded-xl border border-border bg-card/40 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Step 1 of 2
          </p>
          <h3 className="font-heading mt-1 text-xl">Community information</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Paste a listing, fill the fields, and complete Step 1. YouTube video
            is added later in My pipeline (Step 2) — completely separate.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setPasteOpen(true)}
        >
          <Sparkles className="mr-1.5 size-4" />
          Paste / extract URL
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Builder</Label>
          <Select
            value={builderId}
            onValueChange={(value) => setBuilderId(value ?? "")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select builder" />
            </SelectTrigger>
            <SelectContent>
              {builders.map((builder) => (
                <SelectItem key={builder.id} value={builder.id}>
                  {builder.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Community name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>City</Label>
          <Input value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Description</Label>
          <Textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Main highlight</Label>
          <Input
            value={mainHighlight}
            onChange={(e) => setMainHighlight(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Tagline</Label>
          <Input value={tagline} onChange={(e) => setTagline(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>School district</Label>
          <Input
            value={schoolDistrict}
            onChange={(e) => setSchoolDistrict(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Thumbnail URL</Label>
          <Input
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Amenities (one per line)</Label>
          <Textarea
            rows={3}
            value={amenities}
            onChange={(e) => setAmenities(e.target.value)}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Lifestyle notes (extra AI context)</Label>
          <Textarea
            rows={3}
            value={lifestyleNotes}
            onChange={(e) => setLifestyleNotes(e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <Label>Tags</Label>
            <AiContentButtons
              type="community-tags"
              context={{ name, description }}
              onApply={(result) => {
                const next = (Array.isArray(result) ? result : [result]) as string[];
                setTags((prev) => [...new Set([...prev, ...next])]);
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Used to group communities on the homepage (e.g. Luxury, Gated).
          </p>
          <div className="flex flex-wrap gap-2">
            {tagOptions.map((tag) => {
              const selected = tags.includes(tag);
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
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => void saveDraft(false)}
        >
          {busy ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : null}
          Save draft
        </Button>
        <Button
          type="button"
          disabled={busy}
          onClick={() => void saveDraft(true)}
        >
          Complete Step 1
        </Button>
      </div>

      <AiPasteModal
        open={pasteOpen}
        onOpenChange={setPasteOpen}
        onExtracted={applyDraft}
      />
    </div>
  );
}
