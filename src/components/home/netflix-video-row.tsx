"use client";

import { Play } from "lucide-react";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { HomepageSectionVideo } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  extractYouTubeId,
  getEmbedUrl,
  getYouTubeThumbnailUrl,
  resolveThumbnailFromYouTube,
} from "@/lib/youtube";

type NetflixVideoRowProps = {
  title: string;
  videos: HomepageSectionVideo[];
  className?: string;
};

export function NetflixVideoRow({
  title,
  videos,
  className,
}: NetflixVideoRowProps) {
  const [active, setActive] = useState<HomepageSectionVideo | null>(null);
  const activeId = active ? extractYouTubeId(active.youtubeUrl) : null;

  if (videos.length === 0) return null;

  const sorted = [...videos].sort((a, b) => a.order - b.order);

  return (
    <section className={cn("netflix-row px-4 md:px-12", className)}>
      <h2 className="netflix-row-title mb-3 text-lg font-semibold text-foreground md:text-xl">
        {title}
      </h2>
      <div className="netflix-row-track flex gap-3 overflow-x-auto pb-2">
        {sorted.map((video) => {
          const poster = resolveThumbnailFromYouTube(
            video.youtubeUrl,
            video.thumbnailUrl,
          );
          return (
            <button
              key={video.id}
              type="button"
              onClick={() => setActive(video)}
              className="group relative aspect-video w-[min(72vw,280px)] shrink-0 overflow-hidden rounded-md bg-muted text-left md:w-[320px]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={poster || getYouTubeThumbnailUrl(video.youtubeUrl) || ""}
                alt=""
                className="size-full object-cover transition duration-300 group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-black/20 transition group-hover:bg-black/35" />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-black/60 text-white opacity-90 transition group-hover:scale-110 group-hover:opacity-100">
                  <Play className="size-5 fill-current" />
                </span>
              </span>
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                <span className="block text-sm font-medium text-white">
                  {video.title}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <Dialog
        open={active !== null}
        onOpenChange={(open) => {
          if (!open) setActive(null);
        }}
      >
        <DialogContent className="sm:max-w-3xl" showCloseButton>
          <DialogHeader>
            <DialogTitle>{active?.title}</DialogTitle>
          </DialogHeader>
          {activeId && (
            <div className="aspect-video overflow-hidden rounded-lg bg-black">
              <iframe
                title={active?.title ?? "Video"}
                src={getEmbedUrl(activeId, {
                  preset: "interactive",
                  autoplay: true,
                  mute: false,
                })}
                className="size-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
