"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

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
import {
  draftToCommunityForm,
} from "@/lib/listing-draft";
import { toastError, toastSuccess } from "@/lib/toast";
import { isValidYouTubeUrl } from "@/lib/youtube";

type SalesSubmissionWizardProps = {
  onCreated?: (communityId: string) => void;
};

export function SalesSubmissionWizard({ onCreated }: SalesSubmissionWizardProps) {
  const profile = useProfile();
  const { builders, addCommunity, updateCommunity, refresh } =
    useDashboardData();
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
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [communityId, setCommunityId] = useState<string | null>(null);

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
    if (form.youtubeUrl) setYoutubeUrl(form.youtubeUrl);
    const thumb =
      community?.thumbnailUrl?.trim() || form.thumbnailUrl.trim() || "";
    if (thumb) setThumbnailUrl(thumb);

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
        ? "AI organized the listing into the form fields — review before submitting"
        : "Draft loaded — review every field before submitting Step 1",
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

    const builder = builders.find((b) => b.id === builderId);
    setBusy(true);
    try {
      const payload = {
        name: name.trim(),
        city: city.trim(),
        description: description.trim(),
        thumbnailUrl: thumbnailUrl.trim(),
        youtubeUrl: youtubeUrl.trim(),
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
        tags: [],
        isHidden: true,
        pipelineStatus: "draft" as const,
        submittedBy: profile.id,
        ownerId: profile.id,
      };

      let id = communityId;
      if (id) {
        await updateCommunity(id, payload);
      } else {
        const created = await addCommunity(payload);
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
        toastSuccess("Step 1 complete — admin notified");
      } else {
        toastSuccess("Draft saved");
      }

      await refresh();
      if (id) onCreated?.(id);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveStep2() {
    if (!communityId) {
      toastError("Save Step 1 first");
      return;
    }
    if (!isValidYouTubeUrl(youtubeUrl)) {
      toastError("Enter a valid YouTube URL");
      return;
    }
    setBusy(true);
    try {
      await updateCommunity(communityId, {
        youtubeUrl: youtubeUrl.trim(),
        thumbnailUrl: thumbnailUrl.trim() || undefined,
      });
      await fetch("/api/pipeline/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          communityId,
          action: "start_step2",
        }),
      });
      const res = await fetch("/api/pipeline/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          communityId,
          action: "submit_step2",
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Step 2 failed");
      toastSuccess("Step 2 submitted for admin review");
      await refresh();
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Step 2 failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 rounded-xl border border-border bg-card/40 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-xl">New community submission</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Step 1: paste a listing URL or text, fill the fields, submit without
            video. Step 2: attach YouTube when production delivers it.
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
        <div className="space-y-1.5 sm:col-span-2">
          <Label>YouTube URL (Step 2)</Label>
          <Input
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="Add when video production delivers the cut"
          />
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
        <Button
          type="button"
          variant="secondary"
          disabled={busy || !communityId}
          onClick={() => void saveStep2()}
        >
          Submit Step 2 (with video)
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
