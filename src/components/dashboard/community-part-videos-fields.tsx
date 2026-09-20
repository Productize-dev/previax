"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MediaItem } from "@/lib/types";
import { isValidYouTubeUrl } from "@/lib/youtube";

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

type CommunityPartVideosFieldsProps = {
  mediaGallery: MediaItem[];
  onChange: (mediaGallery: MediaItem[]) => void;
};

/** Video-first editor for amenity / area tours stored in mediaGallery. */
export function CommunityPartVideosFields({
  mediaGallery,
  onChange,
}: CommunityPartVideosFieldsProps) {
  const [draftUrl, setDraftUrl] = useState("");
  const [draftCaption, setDraftCaption] = useState("");
  const [error, setError] = useState("");

  const images = mediaGallery.filter((item) => item.type === "image");
  const videos = mediaGallery.filter((item) => item.type === "youtube");

  function commitVideos(nextVideos: MediaItem[]) {
    onChange([...images, ...nextVideos]);
  }

  function updateVideo(index: number, patch: Partial<MediaItem>) {
    const next = [...videos];
    next[index] = { ...next[index], ...patch };
    commitVideos(next);
  }

  function removeVideo(id: string) {
    commitVideos(videos.filter((item) => item.id !== id));
  }

  function addVideo() {
    const url = draftUrl.trim();
    if (!isValidYouTubeUrl(url)) {
      setError("Enter a valid YouTube URL");
      return;
    }

    commitVideos([
      ...videos,
      {
        id: newId("part-video"),
        type: "youtube",
        url,
        caption: draftCaption.trim() || undefined,
      },
    ]);
    setDraftUrl("");
    setDraftCaption("");
    setError("");
  }

  return (
    <div className="space-y-4 rounded-lg border border-dashed border-border p-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Community part videos
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Extra YouTube tours for areas like the clubhouse, pool, or amenities.
          Captions appear as part titles on the community page.
        </p>
      </div>

      {videos.length > 0 && (
        <div className="space-y-3">
          {videos.map((item, index) => (
            <div
              key={item.id}
              className="space-y-3 rounded-lg border border-border bg-background p-3"
            >
              <div className="space-y-2">
                <Label htmlFor={`part-video-url-${item.id}`}>YouTube URL</Label>
                <Input
                  id={`part-video-url-${item.id}`}
                  type="url"
                  value={item.url}
                  onChange={(e) => updateVideo(index, { url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`part-video-caption-${item.id}`}>
                  Part title
                </Label>
                <Input
                  id={`part-video-caption-${item.id}`}
                  value={item.caption ?? ""}
                  onChange={(e) =>
                    updateVideo(index, {
                      caption: e.target.value.trim()
                        ? e.target.value
                        : undefined,
                    })
                  }
                  placeholder="Clubhouse, Pool, Trails…"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => removeVideo(item.id)}
              >
                <Trash2 className="size-4" />
                Remove video
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
        <div className="space-y-2">
          <Label htmlFor="part-video-draft-url">Add YouTube URL</Label>
          <Input
            id="part-video-draft-url"
            type="url"
            value={draftUrl}
            onChange={(e) => {
              setDraftUrl(e.target.value);
              setError("");
            }}
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="part-video-draft-caption">Part title</Label>
          <Input
            id="part-video-draft-caption"
            value={draftCaption}
            onChange={(e) => setDraftCaption(e.target.value)}
            placeholder="Clubhouse"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="button" variant="outline" size="sm" onClick={addVideo}>
          <Plus className="size-4" />
          Add part video
        </Button>
      </div>
    </div>
  );
}
