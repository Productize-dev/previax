"use client";

import { useCallback, useEffect } from "react";
import { ChevronLeft, Play, X } from "lucide-react";

import {
  getCommunityHeroVideoUrl,
  getHomeDisplayName,
  getHomeVideoUrl,
} from "@/lib/community-media";
import type { Community, Home } from "@/lib/types";
import { extractYouTubeId, getEmbedUrl } from "@/lib/youtube";
import { cn } from "@/lib/utils";

type NetflixVideoOverlayProps = {
  open: boolean;
  community: Community;
  home: Home | null;
  homeIndex: number;
  models: Home[];
  onClose: () => void;
  onChangeHome: (index: number) => void;
};

export function NetflixVideoOverlay({
  open,
  community,
  home,
  homeIndex,
  models,
  onClose,
  onChangeHome,
}: NetflixVideoOverlayProps) {
  const videoUrl = home
    ? getHomeVideoUrl(home, community)
    : getCommunityHeroVideoUrl(community);
  const videoId = videoUrl ? extractYouTubeId(videoUrl) : null;
  const embedUrl = videoId
    ? getEmbedUrl(videoId, { autoplay: true, controls: true })
    : null;

  const hasPrevious = home !== null && homeIndex > 0;
  const hasNext = home !== null && homeIndex < models.length - 1;
  const title = home ? getHomeDisplayName(home, homeIndex) : community.name;
  const modelPosition =
    models.length > 0
      ? `Model ${homeIndex + 1} of ${models.length}`
      : "Community tour";

  const goPrevious = useCallback(() => {
    if (hasPrevious) onChangeHome(homeIndex - 1);
  }, [hasPrevious, homeIndex, onChangeHome]);

  const goNext = useCallback(() => {
    if (hasNext) onChangeHome(homeIndex + 1);
  }, [hasNext, homeIndex, onChangeHome]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") goPrevious();
      if (event.key === "ArrowRight") goNext();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [goNext, goPrevious, onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black">
      {embedUrl ? (
        <iframe
          key={`${home?.id ?? community.id}-${embedUrl}`}
          src={embedUrl}
          title={`${title} — ${community.name}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          className="absolute inset-0 size-full"
        />
      ) : (
        <div className="flex size-full items-center justify-center px-6 text-center text-[#b3b3b3]">
          <p>No video is available for this model yet.</p>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/80 via-black/35 to-transparent px-[4%] pb-16 pt-6">
        <div className="pointer-events-auto flex items-start justify-between gap-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-sm text-sm font-medium text-white transition-colors hover:text-white/80"
            aria-label="Close player"
          >
            <ChevronLeft className="size-6" />
            <span className="hidden sm:inline">{community.name}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-white transition-colors hover:bg-white/10"
            aria-label="Close"
          >
            <X className="size-6" />
          </button>
        </div>

        <div className="pointer-events-auto mt-6 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#46d369]">
            Now Playing
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white md:text-4xl">
            {title}
          </h2>
          <p className="mt-2 text-sm text-[#d2d2d2] md:text-base">
            {modelPosition}
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent px-[4%] pb-8 pt-20">
        <div className="pointer-events-auto flex flex-wrap items-center gap-3">
          {hasPrevious && (
            <button
              type="button"
              onClick={goPrevious}
              className="inline-flex items-center gap-2 rounded bg-[rgba(109,109,110,0.7)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[rgba(109,109,110,0.55)]"
            >
              Previous model
            </button>
          )}
          {hasNext && (
            <button
              type="button"
              onClick={goNext}
              className={cn(
                "inline-flex items-center gap-2 rounded bg-white px-5 py-2.5 text-sm font-semibold text-[#141414] transition-colors",
                "hover:bg-white/85",
              )}
            >
              <Play className="size-4 fill-current" />
              Next model
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
