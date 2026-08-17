"use client";

import { Bed, Bath, Maximize, Play } from "lucide-react";

import { YouTubePosterImage } from "@/components/communities/youtube-poster-image";
import { YouTubeEmbed } from "@/components/video/youtube-embed";
import { usePrefersCoarsePointer } from "@/hooks/use-prefers-coarse-pointer";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import {
  getHomePosterUrl,
  getHomeVideoUrl,
} from "@/lib/community-media";
import { pricePerSqft } from "@/lib/community-utils";
import type { Community, Home } from "@/lib/types";

type HomeHeroProps = {
  home: Home;
  community: Community;
  onPlay?: () => void;
};

export function HomeHero({ home, community, onPlay }: HomeHeroProps) {
  const coarse = usePrefersCoarsePointer();
  const reduceMotion = usePrefersReducedMotion();
  const ppsf = pricePerSqft(home);
  const status = home.status ?? "available";
  const videoUrl = getHomeVideoUrl(home, community);
  const poster = getHomePosterUrl(home, community);
  const cover = home.imageUrls[0] || poster;
  const showBackgroundVideo =
    Boolean(videoUrl) && !coarse && !reduceMotion;

  return (
    <div className="relative mt-4 min-h-[55svh] overflow-hidden md:min-h-[65svh]">
      {showBackgroundVideo && videoUrl ? (
        <>
          <YouTubePosterImage
            videoUrl={videoUrl}
            fallbackUrl={cover}
            className="absolute inset-0 size-full"
            imgClassName="object-cover scale-105"
            loading="eager"
            fetchPriority="high"
          />
          <YouTubeEmbed
            youtubeUrl={videoUrl}
            title={home.modelName || community.name}
            preset="background"
            autoplay
            mute
            loop
            loading="eager"
            fillContainer
            cover
            className="absolute inset-0 size-full"
          />
        </>
      ) : cover ? (
        videoUrl ? (
          <YouTubePosterImage
            videoUrl={videoUrl}
            fallbackUrl={cover}
            className="absolute inset-0 size-full"
            imgClassName="object-cover scale-105"
            loading="eager"
            fetchPriority="high"
          />
        ) : (
          <img
            src={cover}
            alt=""
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover scale-105"
          />
        )
      ) : (
        <div className="absolute inset-0 bg-muted" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-black/40" />

      {videoUrl && onPlay && (
        <button
          type="button"
          onClick={onPlay}
          className="absolute left-1/2 top-[42%] z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-white px-6 py-3 text-base font-bold text-[#141414] shadow-lg"
          aria-label="Play model video"
        >
          <Play className="size-5 fill-current" />
          Play
        </button>
      )}

      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-6 pb-10 pt-32 md:pb-14">
        <p className="section-eyebrow">
          {community.name} · {community.city}, NC
        </p>
        <h1 className="font-heading mt-3 text-4xl text-foreground md:text-5xl lg:text-6xl">
          ${home.price.toLocaleString()}
        </h1>
        {home.tagline && (
          <p className="mt-3 max-w-2xl text-lg text-foreground/90 md:text-xl">
            {home.tagline}
          </p>
        )}
        <div className="stat-pipes mt-4 text-foreground/80">
          <span className="flex items-center gap-1">
            <Bed className="size-4" />
            {home.bedrooms} bd
          </span>
          <span className="flex items-center gap-1">
            <Bath className="size-4" />
            {home.bathrooms} ba
          </span>
          <span className="flex items-center gap-1">
            <Maximize className="size-4" />
            {home.sqft.toLocaleString()} sqft
          </span>
          {ppsf && <span>${ppsf}/sqft</span>}
          {status !== "available" && (
            <span className="capitalize">{status.replace("-", " ")}</span>
          )}
        </div>
      </div>
    </div>
  );
}
