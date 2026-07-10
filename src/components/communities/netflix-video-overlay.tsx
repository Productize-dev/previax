"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ExternalLink, Play, X } from "lucide-react";

import { YouTubeEmbed } from "@/components/video/youtube-embed";
import {
  getCommunityHeroVideoUrl,
  getHomeDisplayName,
  getHomeVideoUrl,
} from "@/lib/community-media";
import type { Community, Home } from "@/lib/types";
import { getWatchUrl } from "@/lib/youtube";
import { cn } from "@/lib/utils";

const CHROME_HIDE_MS = 3500;

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
  const [chromeVisible, setChromeVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const videoUrl = home
    ? getHomeVideoUrl(home, community)
    : getCommunityHeroVideoUrl(community);
  const watchUrl = videoUrl ? getWatchUrl(videoUrl) : null;

  const hasPrevious = home !== null && homeIndex > 0;
  const hasNext = home !== null && homeIndex < models.length - 1;
  const title = home ? getHomeDisplayName(home, homeIndex) : community.name;
  const modelPosition =
    models.length > 0
      ? `Model ${homeIndex + 1} of ${models.length}`
      : "Community tour";

  const revealChrome = useCallback(() => {
    setChromeVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setChromeVisible(false);
    }, CHROME_HIDE_MS);
  }, []);

  const goPrevious = useCallback(() => {
    if (hasPrevious) onChangeHome(homeIndex - 1);
  }, [hasPrevious, homeIndex, onChangeHome]);

  const goNext = useCallback(() => {
    if (hasNext) onChangeHome(homeIndex + 1);
  }, [hasNext, homeIndex, onChangeHome]);

  useEffect(() => {
    if (!open) return;

    revealChrome();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") goPrevious();
      if (event.key === "ArrowRight") goNext();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousemove", revealChrome);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousemove", revealChrome);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [goNext, goPrevious, onClose, open, revealChrome]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-black"
      role="dialog"
      aria-modal="true"
      aria-label={`Video player: ${title}`}
      onMouseMove={revealChrome}
    >
      <header
        className={cn(
          "shrink-0 border-b border-white/10 bg-black px-[4%] py-3 transition-opacity duration-300",
          chromeVisible ? "opacity-100" : "hidden",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-sm text-sm font-medium text-white transition-colors hover:text-white/80"
            aria-label="Close player"
          >
            <ChevronLeft className="size-6" />
            <span className="hidden sm:inline">{community.name}</span>
          </button>

          <div className="flex items-center gap-2">
            {watchUrl && (
              <a
                href={watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-white/25 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/10 sm:text-sm"
              >
                <ExternalLink className="size-3.5" />
                YouTube
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-white transition-colors hover:bg-white/10"
              aria-label="Close"
            >
              <X className="size-6" />
            </button>
          </div>
        </div>

        <div className="mt-3 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#46d369]">
            Now Playing
          </p>
          <h2 className="mt-1 text-xl font-bold text-white md:text-2xl">
            {title}
          </h2>
          <p className="mt-1 text-sm text-[#d2d2d2]">{modelPosition}</p>
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        {videoUrl ? (
          <YouTubeEmbed
            key={`${home?.id ?? community.id}-${videoUrl}`}
            youtubeUrl={videoUrl}
            title={`${title} — ${community.name}`}
            preset="interactive"
            autoplay
            mute={false}
            loop={false}
            loading="eager"
            fillContainer
            className="size-full"
          />
        ) : (
          <div className="flex size-full items-center justify-center px-6 text-center text-[#b3b3b3]">
            <p>No video is available for this model yet.</p>
          </div>
        )}

        {!chromeVisible && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-2.5 bg-gradient-to-t from-black/60 to-transparent pb-5 pt-10"
            aria-hidden
          >
            <p className="text-[11px] font-medium tracking-wide text-white/55">
              Move mouse for options · Esc to close
            </p>
            <div className="h-[3px] w-10 rounded-full bg-white/70 shadow-[0_0_8px_rgba(255,255,255,0.35)]" />
          </div>
        )}
      </div>

      <footer
        className={cn(
          "shrink-0 border-t border-white/10 bg-black px-[4%] py-3 transition-opacity duration-300",
          chromeVisible ? "opacity-100" : "hidden",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
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
          <p className="text-xs text-[#808080]">
            Volume, captions (CC), quality &amp; fullscreen — use the YouTube
            controls on the video
          </p>
        </div>
      </footer>
    </div>
  );
}
