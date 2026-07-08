"use client";

import { Plus, Trash2 } from "lucide-react";

import { ImageInput } from "@/components/dashboard/image-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  CommunityInput,
  CommunityReview,
  MediaItem,
  NearbyPlace,
  SchoolInfo,
} from "@/lib/types";

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

type CommunityExperienceFieldsProps = {
  form: CommunityInput;
  onChange: (form: CommunityInput) => void;
};

export function CommunityExperienceFields({
  form,
  onChange,
}: CommunityExperienceFieldsProps) {
  function patch(partial: Partial<CommunityInput>) {
    onChange({ ...form, ...partial });
  }

  function updateSchools(schools: SchoolInfo[]) {
    patch({ schools });
  }

  function updatePlaces(places: NearbyPlace[]) {
    patch({ nearbyPlaces: places });
  }

  function updateReviews(reviews: CommunityReview[]) {
    patch({ reviews });
  }

  function updateGallery(mediaGallery: MediaItem[]) {
    patch({ mediaGallery });
  }

  const schools = form.schools ?? [];
  const nearbyPlaces = form.nearbyPlaces ?? [];
  const reviews = form.reviews ?? [];
  const mediaGallery = form.mediaGallery ?? [];

  return (
    <div className="space-y-6 rounded-lg border border-border bg-muted/20 p-4">
      <div>
        <p className="font-medium">Community experience</p>
        <p className="text-sm text-muted-foreground">
          Schools, dining, reviews, and extra photos/videos for the detail page.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tagline">Tagline (hero subtitle)</Label>
        <Input
          id="tagline"
          value={form.tagline ?? ""}
          onChange={(e) => patch({ tagline: e.target.value })}
          placeholder="Where oak-lined trails meet modern living"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lifestyleNotes">Lifestyle overview</Label>
        <Textarea
          id="lifestyleNotes"
          value={form.lifestyleNotes ?? ""}
          onChange={(e) => patch({ lifestyleNotes: e.target.value })}
          rows={2}
          placeholder="Short paragraph about life in this area..."
        />
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        <Label>Schools</Label>
        <Textarea
          value={form.schoolOverview ?? ""}
          onChange={(e) => patch({ schoolOverview: e.target.value })}
          rows={2}
          placeholder="Overview of schools in the area..."
        />
        {schools.map((school, index) => (
          <div
            key={school.id}
            className="grid gap-3 rounded-lg border border-border bg-background p-3 sm:grid-cols-2"
          >
            <Input
              placeholder="School name"
              value={school.name}
              onChange={(e) => {
                const next = [...schools];
                next[index] = { ...school, name: e.target.value };
                updateSchools(next);
              }}
            />
            <Select
              value={school.type}
              onValueChange={(value) => {
                const next = [...schools];
                next[index] = {
                  ...school,
                  type: value as SchoolInfo["type"],
                };
                updateSchools(next);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="elementary">Elementary</SelectItem>
                <SelectItem value="middle">Middle</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Rating (e.g. 9/10)"
              value={school.rating ?? ""}
              onChange={(e) => {
                const next = [...schools];
                next[index] = { ...school, rating: e.target.value };
                updateSchools(next);
              }}
            />
            <Input
              placeholder="Distance (e.g. 1.2 mi)"
              value={school.distance ?? ""}
              onChange={(e) => {
                const next = [...schools];
                next[index] = { ...school, distance: e.target.value };
                updateSchools(next);
              }}
            />
            <Textarea
              className="sm:col-span-2"
              placeholder="Notes"
              value={school.notes ?? ""}
              onChange={(e) => {
                const next = [...schools];
                next[index] = { ...school, notes: e.target.value };
                updateSchools(next);
              }}
              rows={2}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="sm:col-span-2 text-destructive"
              onClick={() =>
                updateSchools(schools.filter((s) => s.id !== school.id))
              }
            >
              <Trash2 className="size-4" />
              Remove school
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            updateSchools([
              ...schools,
              { id: newId("school"), name: "", type: "elementary" },
            ])
          }
        >
          <Plus className="size-4" />
          Add school
        </Button>
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        <Label>Nearby places & dining</Label>
        <Textarea
          value={form.diningOverview ?? ""}
          onChange={(e) => patch({ diningOverview: e.target.value })}
          rows={2}
          placeholder="Overview of restaurants and local spots..."
        />
        {nearbyPlaces.map((place, index) => (
          <div
            key={place.id}
            className="space-y-3 rounded-lg border border-border bg-background p-3"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Place name"
                value={place.name}
                onChange={(e) => {
                  const next = [...nearbyPlaces];
                  next[index] = { ...place, name: e.target.value };
                  updatePlaces(next);
                }}
              />
              <Select
                value={place.category}
                onValueChange={(value) => {
                  const next = [...nearbyPlaces];
                  next[index] = {
                    ...place,
                    category: value as NearbyPlace["category"],
                  };
                  updatePlaces(next);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="cafe">Café</SelectItem>
                  <SelectItem value="grocery">Grocery</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="park">Park</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Cuisine / type"
                value={place.cuisine ?? ""}
                onChange={(e) => {
                  const next = [...nearbyPlaces];
                  next[index] = { ...place, cuisine: e.target.value };
                  updatePlaces(next);
                }}
              />
              <Input
                placeholder="Distance"
                value={place.distance ?? ""}
                onChange={(e) => {
                  const next = [...nearbyPlaces];
                  next[index] = { ...place, distance: e.target.value };
                  updatePlaces(next);
                }}
              />
            </div>
            <Textarea
              placeholder="Short description"
              value={place.description ?? ""}
              onChange={(e) => {
                const next = [...nearbyPlaces];
                next[index] = { ...place, description: e.target.value };
                updatePlaces(next);
              }}
              rows={2}
            />
            <ImageInput
              id={`place-image-${place.id}`}
              label="Photo (optional)"
              value={place.imageUrl ?? ""}
              onChange={(url) => {
                const next = [...nearbyPlaces];
                next[index] = { ...place, imageUrl: url };
                updatePlaces(next);
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() =>
                updatePlaces(nearbyPlaces.filter((p) => p.id !== place.id))
              }
            >
              <Trash2 className="size-4" />
              Remove place
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            updatePlaces([
              ...nearbyPlaces,
              { id: newId("place"), name: "", category: "restaurant" },
            ])
          }
        >
          <Plus className="size-4" />
          Add nearby place
        </Button>
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        <Label>Resident reviews</Label>
        {reviews.map((review, index) => (
          <div
            key={review.id}
            className="space-y-3 rounded-lg border border-border bg-background p-3"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Author name"
                value={review.author}
                onChange={(e) => {
                  const next = [...reviews];
                  next[index] = { ...review, author: e.target.value };
                  updateReviews(next);
                }}
              />
              <Input
                type="number"
                min={1}
                max={5}
                placeholder="Rating 1–5"
                value={review.rating}
                onChange={(e) => {
                  const next = [...reviews];
                  next[index] = {
                    ...review,
                    rating: Number(e.target.value) || 5,
                  };
                  updateReviews(next);
                }}
              />
            </div>
            <Textarea
              placeholder="Review quote"
              value={review.quote}
              onChange={(e) => {
                const next = [...reviews];
                next[index] = { ...review, quote: e.target.value };
                updateReviews(next);
              }}
              rows={3}
            />
            <Input
              placeholder="Date (e.g. 2025-11)"
              value={review.date ?? ""}
              onChange={(e) => {
                const next = [...reviews];
                next[index] = { ...review, date: e.target.value };
                updateReviews(next);
              }}
            />
            <ImageInput
              id={`review-avatar-${review.id}`}
              label="Avatar (optional)"
              value={review.avatarUrl ?? ""}
              onChange={(url) => {
                const next = [...reviews];
                next[index] = { ...review, avatarUrl: url };
                updateReviews(next);
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() =>
                updateReviews(reviews.filter((r) => r.id !== review.id))
              }
            >
              <Trash2 className="size-4" />
              Remove review
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            updateReviews([
              ...reviews,
              {
                id: newId("review"),
                author: "",
                rating: 5,
                quote: "",
              },
            ])
          }
        >
          <Plus className="size-4" />
          Add review
        </Button>
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        <Label>Photo & video gallery</Label>
        {mediaGallery.map((item, index) => (
          <div
            key={item.id}
            className="space-y-3 rounded-lg border border-border bg-background p-3"
          >
            <Select
              value={item.type}
              onValueChange={(value) => {
                const next = [...mediaGallery];
                next[index] = {
                  ...item,
                  type: value as MediaItem["type"],
                };
                updateGallery(next);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="youtube">YouTube video</SelectItem>
              </SelectContent>
            </Select>
            {item.type === "image" ? (
              <ImageInput
                id={`media-${item.id}`}
                label="Image"
                value={item.url}
                onChange={(url) => {
                  const next = [...mediaGallery];
                  next[index] = { ...item, url };
                  updateGallery(next);
                }}
              />
            ) : (
              <Input
                placeholder="YouTube URL"
                value={item.url}
                onChange={(e) => {
                  const next = [...mediaGallery];
                  next[index] = { ...item, url: e.target.value };
                  updateGallery(next);
                }}
              />
            )}
            <Input
              placeholder="Caption"
              value={item.caption ?? ""}
              onChange={(e) => {
                const next = [...mediaGallery];
                next[index] = { ...item, caption: e.target.value };
                updateGallery(next);
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() =>
                updateGallery(mediaGallery.filter((m) => m.id !== item.id))
              }
            >
              <Trash2 className="size-4" />
              Remove media
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            updateGallery([
              ...mediaGallery,
              { id: newId("media"), type: "image", url: "" },
            ])
          }
        >
          <Plus className="size-4" />
          Add photo or video
        </Button>
      </div>
    </div>
  );
}
