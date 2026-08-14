"use client";

import { useState } from "react";

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
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { toastError, toastSuccess } from "@/lib/toast";
import type { ApartmentCommunity, ApartmentCommunityInput } from "@/lib/types";
import {
  getYouTubeThumbnailUrl,
  isValidYouTubeUrl,
  isYouTubeThumbnailUrl,
  resolveThumbnailFromYouTube,
} from "@/lib/youtube";

function linesToList(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

const emptyForm: ApartmentCommunityInput & { amenitiesText: string } = {
  name: "",
  city: "",
  description: "",
  thumbnailUrl: "",
  youtubeUrl: "",
  leasingName: "",
  leasingPhone: "",
  leasingEmail: "",
  leasingPhotoUrl: "",
  tagline: "",
  amenities: [],
  amenitiesText: "",
  isHidden: false,
};

function toForm(community: ApartmentCommunity) {
  return {
    name: community.name,
    city: community.city,
    description: community.description,
    thumbnailUrl: community.thumbnailUrl,
    youtubeUrl: community.youtubeUrl,
    leasingName: community.leasingName,
    leasingPhone: community.leasingPhone,
    leasingEmail: community.leasingEmail,
    leasingPhotoUrl: community.leasingPhotoUrl,
    tagline: community.tagline ?? "",
    amenities: community.amenities ?? [],
    amenitiesText: (community.amenities ?? []).join("\n"),
    isHidden: community.isHidden ?? false,
  };
}

type ApartmentCommunityFormProps = {
  editingItem: ApartmentCommunity | null;
  onEditComplete: () => void;
};

export function ApartmentCommunityForm({
  editingItem,
  onEditComplete,
}: ApartmentCommunityFormProps) {
  const { addApartmentCommunity, updateApartmentCommunity } =
    useDashboardData();
  const [form, setForm] = useState(() =>
    editingItem ? toForm(editingItem) : emptyForm,
  );
  const [youtubeError, setYoutubeError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isEditing = editingItem !== null;

  function updateField<K extends keyof typeof form>(
    field: K,
    value: (typeof form)[K],
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.city.trim()) {
      toastError("Name and city are required.");
      return;
    }
    if (form.youtubeUrl.trim() && !isValidYouTubeUrl(form.youtubeUrl)) {
      setYoutubeError("Please enter a valid YouTube URL");
      return;
    }

    setSubmitting(true);
    try {
      let thumbnailUrl = form.thumbnailUrl.trim();
      if (
        form.youtubeUrl.trim() &&
        (!thumbnailUrl || isYouTubeThumbnailUrl(thumbnailUrl))
      ) {
        thumbnailUrl =
          (await resolveThumbnailFromYouTube(form.youtubeUrl)) ||
          getYouTubeThumbnailUrl(form.youtubeUrl) ||
          thumbnailUrl;
      }

      const payload: ApartmentCommunityInput = {
        name: form.name.trim(),
        city: form.city.trim(),
        description: form.description.trim(),
        thumbnailUrl,
        youtubeUrl: form.youtubeUrl.trim(),
        leasingName: form.leasingName.trim(),
        leasingPhone: form.leasingPhone.trim(),
        leasingEmail: form.leasingEmail.trim(),
        leasingPhotoUrl: form.leasingPhotoUrl.trim(),
        tagline: form.tagline?.trim() ?? "",
        amenities: linesToList(form.amenitiesText),
        isHidden: form.isHidden,
      };

      if (isEditing) {
        await updateApartmentCommunity(editingItem.id, payload);
        toastSuccess("Apartment community updated.");
        onEditComplete();
      } else {
        await addApartmentCommunity(payload);
        toastSuccess("Apartment community created.");
        setForm(emptyForm);
      }
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl">
          {isEditing ? "Edit apartment community" : "Add apartment community"}
        </CardTitle>
        <CardDescription>
          Rental complexes for relocators. Floor plans are managed below after
          you save the community.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="apt-name">Name</Label>
              <Input
                id="apt-name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apt-city">City</Label>
              <Input
                id="apt-city"
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apt-tagline">Tagline</Label>
            <Input
              id="apt-tagline"
              value={form.tagline}
              onChange={(e) => updateField("tagline", e.target.value)}
              placeholder="Rent while you relocate"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apt-description">Description</Label>
            <Textarea
              id="apt-description"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apt-youtube">YouTube URL</Label>
            <Input
              id="apt-youtube"
              value={form.youtubeUrl}
              onChange={(e) => {
                updateField("youtubeUrl", e.target.value);
                setYoutubeError("");
              }}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            {youtubeError && (
              <p className="text-sm text-destructive">{youtubeError}</p>
            )}
          </div>

          <ImageInput
            id="apt-thumbnail"
            label="Thumbnail"
            value={form.thumbnailUrl}
            onChange={(url) => updateField("thumbnailUrl", url)}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="apt-leasing-name">Leasing contact name</Label>
              <Input
                id="apt-leasing-name"
                value={form.leasingName}
                onChange={(e) => updateField("leasingName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apt-leasing-phone">Leasing phone</Label>
              <Input
                id="apt-leasing-phone"
                value={form.leasingPhone}
                onChange={(e) => updateField("leasingPhone", e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="apt-leasing-email">Leasing email</Label>
              <Input
                id="apt-leasing-email"
                type="email"
                value={form.leasingEmail}
                onChange={(e) => updateField("leasingEmail", e.target.value)}
              />
            </div>
          </div>

          <ImageInput
            id="apt-leasing-photo"
            label="Leasing photo"
            value={form.leasingPhotoUrl}
            onChange={(url) => updateField("leasingPhotoUrl", url)}
          />

          <div className="space-y-2">
            <Label htmlFor="apt-amenities">Amenities (one per line)</Label>
            <Textarea
              id="apt-amenities"
              value={form.amenitiesText}
              onChange={(e) => updateField("amenitiesText", e.target.value)}
              rows={3}
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isHidden}
              onChange={(e) => updateField("isHidden", e.target.checked)}
            />
            Hidden from public site
          </label>

          <div className="flex gap-2">
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "Saving…"
                : isEditing
                  ? "Save changes"
                  : "Add community"}
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
