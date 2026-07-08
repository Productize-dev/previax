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
import type { HomeInput, HomeListingCategory, HomeReview, HomeRoom, MediaItem } from "@/lib/types";
import {
  ALL_HOME_LISTING_CATEGORIES,
  HOME_LISTING_CATEGORY_LABELS,
} from "@/lib/home-listing-categories";

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

type HomeExperienceFieldsProps = {
  form: HomeInput;
  onChange: (form: HomeInput) => void;
};

export function HomeExperienceFields({
  form,
  onChange,
}: HomeExperienceFieldsProps) {
  function patch(partial: Partial<HomeInput>) {
    onChange({ ...form, ...partial });
  }

  const highlights = form.highlights ?? [];
  const rooms = form.rooms ?? [];
  const reviews = form.reviews ?? [];
  const mediaGallery = form.mediaGallery ?? [];
  const listingCategories = form.listingCategories ?? [];

  function toggleListingCategory(category: HomeListingCategory) {
    const next = listingCategories.includes(category)
      ? listingCategories.filter((item) => item !== category)
      : [...listingCategories, category];
    patch({ listingCategories: next });
  }

  function updateHighlights(text: string) {
    patch({
      highlights: text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    });
  }

  return (
    <div className="space-y-6 rounded-lg border border-border bg-muted/20 p-4">
      <div>
        <p className="font-medium">Home experience</p>
        <p className="text-sm text-muted-foreground">
          Rich detail sections on the full home page — highlights, rooms, gallery,
          and reviews.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Homepage listing badges</Label>
        <p className="text-sm text-muted-foreground">
          Shown on Netflix-style home rows on the main page.
        </p>
        <div className="flex flex-wrap gap-2">
          {ALL_HOME_LISTING_CATEGORIES.map((category) => {
            const active = listingCategories.includes(category);
            return (
              <Button
                key={category}
                type="button"
                size="sm"
                variant={active ? "default" : "outline"}
                onClick={() => toggleListingCategory(category)}
              >
                {HOME_LISTING_CATEGORY_LABELS[category]}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="homeTagline">Tagline</Label>
        <Input
          id="homeTagline"
          value={form.tagline ?? ""}
          onChange={(e) => patch({ tagline: e.target.value })}
          placeholder="Open concept living with main-level primary"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="featuresOverview">Features overview</Label>
        <Textarea
          id="featuresOverview"
          value={form.featuresOverview ?? ""}
          onChange={(e) => patch({ featuresOverview: e.target.value })}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="highlights">Highlights (one per line)</Label>
        <Textarea
          id="highlights"
          value={highlights.join("\n")}
          onChange={(e) => updateHighlights(e.target.value)}
          rows={3}
          placeholder="Primary suite on main"
        />
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        <Label>Rooms & finishes</Label>
        {rooms.map((room, index) => (
          <div
            key={room.id}
            className="space-y-3 rounded-lg border border-border bg-background p-3"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Room name"
                value={room.name}
                onChange={(e) => {
                  const next = [...rooms];
                  next[index] = { ...room, name: e.target.value };
                  patch({ rooms: next });
                }}
              />
              <Input
                placeholder="Size (e.g. 14×18 ft)"
                value={room.size ?? ""}
                onChange={(e) => {
                  const next = [...rooms];
                  next[index] = { ...room, size: e.target.value };
                  patch({ rooms: next });
                }}
              />
            </div>
            <Textarea
              placeholder="Notes"
              value={room.notes ?? ""}
              onChange={(e) => {
                const next = [...rooms];
                next[index] = { ...room, notes: e.target.value };
                patch({ rooms: next });
              }}
              rows={2}
            />
            <ImageInput
              id={`room-image-${room.id}`}
              label="Photo (optional)"
              value={room.imageUrl ?? ""}
              onChange={(url) => {
                const next = [...rooms];
                next[index] = { ...room, imageUrl: url };
                patch({ rooms: next });
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() =>
                patch({ rooms: rooms.filter((r) => r.id !== room.id) })
              }
            >
              <Trash2 className="size-4" />
              Remove room
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            patch({
              rooms: [...rooms, { id: newId("room"), name: "" }],
            })
          }
        >
          <Plus className="size-4" />
          Add room
        </Button>
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        <Label>Reviews & tour feedback</Label>
        {reviews.map((review, index) => (
          <div
            key={review.id}
            className="space-y-3 rounded-lg border border-border bg-background p-3"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Author"
                value={review.author}
                onChange={(e) => {
                  const next = [...reviews];
                  next[index] = { ...review, author: e.target.value };
                  patch({ reviews: next });
                }}
              />
              <Input
                type="number"
                min={1}
                max={5}
                value={review.rating}
                onChange={(e) => {
                  const next = [...reviews];
                  next[index] = {
                    ...review,
                    rating: Number(e.target.value) || 5,
                  };
                  patch({ reviews: next });
                }}
              />
            </div>
            <Textarea
              placeholder="Quote"
              value={review.quote}
              onChange={(e) => {
                const next = [...reviews];
                next[index] = { ...review, quote: e.target.value };
                patch({ reviews: next });
              }}
              rows={2}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() =>
                patch({ reviews: reviews.filter((r) => r.id !== review.id) })
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
            patch({
              reviews: [
                ...reviews,
                { id: newId("review"), author: "", rating: 5, quote: "" },
              ],
            })
          }
        >
          <Plus className="size-4" />
          Add review
        </Button>
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        <Label>Extra photos & video</Label>
        {mediaGallery.map((item, index) => (
          <div
            key={item.id}
            className="space-y-3 rounded-lg border border-border bg-background p-3"
          >
            <Select
              value={item.type}
              onValueChange={(value) => {
                const next = [...mediaGallery];
                next[index] = { ...item, type: value as MediaItem["type"] };
                patch({ mediaGallery: next });
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
                id={`home-media-${item.id}`}
                label="Image"
                value={item.url}
                onChange={(url) => {
                  const next = [...mediaGallery];
                  next[index] = { ...item, url };
                  patch({ mediaGallery: next });
                }}
              />
            ) : (
              <Input
                placeholder="YouTube URL"
                value={item.url}
                onChange={(e) => {
                  const next = [...mediaGallery];
                  next[index] = { ...item, url: e.target.value };
                  patch({ mediaGallery: next });
                }}
              />
            )}
            <Input
              placeholder="Caption"
              value={item.caption ?? ""}
              onChange={(e) => {
                const next = [...mediaGallery];
                next[index] = { ...item, caption: e.target.value };
                patch({ mediaGallery: next });
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() =>
                patch({
                  mediaGallery: mediaGallery.filter((m) => m.id !== item.id),
                })
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
            patch({
              mediaGallery: [
                ...mediaGallery,
                { id: newId("media"), type: "image", url: "" },
              ],
            })
          }
        >
          <Plus className="size-4" />
          Add photo or video
        </Button>
      </div>
    </div>
  );
}
