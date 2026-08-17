"use client";

import { Play } from "lucide-react";
import { useState } from "react";

import { YouTubePosterImage } from "@/components/communities/youtube-poster-image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { YouTubeEmbed } from "@/components/video/youtube-embed";
import type { HomepageSectionVideo } from "@/lib/types";
import { cn } from "@/lib/utils";

type NetflixVideoRowProps = {
  title: string;
  videos: HomepageSectionVideo[];
  className?: string;
  /** Branded "Originals" chrome (By Previax / custom video rows). */
  branded?: boolean;
};

export function NetflixVideoRow({
  title,
  videos,
  className,
  branded = true,
}: NetflixVideoRowProps) {
  const [active, setActive] = useState<HomepageSectionVideo | null>(null);

  if (videos.length === 0) return null;

  const sorted = [...videos].sort((a, b) => a.order - b.order);

  return (
    <section className={cn("netflix-row-section group/row", className)}>
      {branded ? (
        <div className="mb-3 px-[4%] md:mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#46d369] sm:text-xs">
            Previax Original
          </p>
          <h2 className="mt-1 font-sans text-xl font-semibold tracking-wide text-white md:text-2xl lg:text-[1.75rem]">
            {title}
          </h2>
          <span
            aria-hidden
            className="mt-2 block h-0.5 w-10 rounded-full bg-[#46d369]"
          />
        </div>
      ) : (
        <h2 className="netflix-row-title">{title}</h2>
      )}

      <div className="netflix-focus-track !items-stretch !pb-6 md:!pb-8">
        {sorted.map((video) => {
          return (
            <button
              key={video.id}
              type="button"
              onClick={() => setActive(video)}
              className="group relative aspect-video w-[min(85vw,300px)] shrink-0 overflow-hidden rounded-[3px] bg-[#2f2f2f] text-left ring-1 ring-white/10 transition duration-300 hover:ring-white/25 sm:w-[min(42vw,400px)] md:w-[min(36vw,440px)]"
            >
              <YouTubePosterImage
                videoUrl={video.youtubeUrl}
                fallbackUrl={video.thumbnailUrl}
                className="size-full"
                imgClassName="object-cover transition duration-300 group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-black/20 transition group-hover:bg-black/40" />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex size-14 items-center justify-center rounded-full bg-black/65 text-white shadow-lg ring-1 ring-white/20 opacity-95 transition group-hover:scale-110 group-hover:bg-black/75 group-hover:opacity-100 sm:size-16">
                  <Play className="size-6 fill-current pl-0.5 sm:size-7" />
                </span>
              </span>
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent px-3 pb-3 pt-12">
                <span className="block text-base font-semibold text-white sm:text-lg">
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
          {active && (
            <YouTubeEmbed
              youtubeUrl={active.youtubeUrl}
              title={active.title}
              preset="interactive"
              autoplay
              mute
              className="overflow-hidden rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
