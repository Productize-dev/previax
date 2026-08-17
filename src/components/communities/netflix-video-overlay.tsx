"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ExternalLink, Play, Volume2, VolumeX, X } from "lucide-react";

import { YouTubePosterImage } from "@/components/communities/youtube-poster-image";
import {
  YouTubeEmbed,
  youtubeMute,
  youtubeUnmute,
} from "@/components/video/youtube-embed";
import { usePrefersCoarsePointer } from "@/hooks/use-prefers-coarse-pointer";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import {
  getCommunityHeroPosterUrl,
  getCommunityHeroVideoUrl,
  getHomeDisplayName,
  getHomePosterUrl,
  getHomeVideoUrl,
} from "@/lib/community-media";
import type { Community, Home } from "@/lib/types";
import { getWatchUrl } from "@/lib/youtube";
import { cn } from "@/lib/utils";

const CHROME_HIDE_MS = 3000;
const CHROME_HIDE_COARSE_MS = 6000;
const SWIPE_THRESHOLD_PX = 50;

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
  const coarse = usePrefersCoarsePointer();
  const reduceMotion = usePrefersReducedMotion();
  const [chromeVisible, setChromeVisible] = useState(true);
  const [muted, setMuted] = useState(true);
  const [playbackStarted, setPlaybackStarted] = useState(!reduceMotion);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoIframeRef = useRef<HTMLIFrameElement>(null);
  const touchStartX = useRef<number | null>(null);

  const videoUrl = home
    ? getHomeVideoUrl(home, community)
    : getCommunityHeroVideoUrl(community);
  const posterFallback = home
    ? getHomePosterUrl(home, community)
    : getCommunityHeroPosterUrl(community);
  const watchUrl = videoUrl ? getWatchUrl(videoUrl) : null;

  const hasPrevious = home !== null && homeIndex > 0;
  const hasNext = home !== null && homeIndex < models.length - 1;
  const title = home ? getHomeDisplayName(home, homeIndex) : community.name;
  const modelPosition =
    models.length > 0
      ? `Model ${homeIndex + 1} of ${models.length}`
      : "Community tour";

  const hideDelay = coarse ? CHROME_HIDE_COARSE_MS : CHROME_HIDE_MS;
  const shouldAutoplay = !reduceMotion;

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      setChromeVisible(false);
    }, hideDelay);
  }, [clearHideTimer, hideDelay]);

  const revealChrome = useCallback(() => {
    setChromeVisible(true);
    scheduleHide();
  }, [scheduleHide]);

  const holdChrome = useCallback(() => {
    setChromeVisible(true);
    clearHideTimer();
  }, [clearHideTimer]);

  const goPrevious = useCallback(() => {
    if (hasPrevious) onChangeHome(homeIndex - 1);
  }, [hasPrevious, homeIndex, onChangeHome]);

  const goNext = useCallback(() => {
    if (hasNext) onChangeHome(homeIndex + 1);
  }, [hasNext, homeIndex, onChangeHome]);

  const unmute = useCallback(() => {
    setMuted(false);
    setPlaybackStarted(true);
    youtubeUnmute(videoIframeRef.current);
    revealChrome();
  }, [revealChrome]);

  const startPlayback = useCallback(() => {
    setPlaybackStarted(true);
    revealChrome();
  }, [revealChrome]);

  useEffect(() => {
    if (!open) return;

    setMuted(true);
    setPlaybackStarted(!reduceMotion);
    setChromeVisible(true);
    scheduleHide();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") goPrevious();
      if (event.key === "ArrowRight") goNext();
      if (event.key === "m" || event.key === "M") unmute();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
      clearHideTimer();
    };
  }, [
    clearHideTimer,
    goNext,
    goPrevious,
    onClose,
    open,
    reduceMotion,
    scheduleHide,
    unmute,
  ]);

  useEffect(() => {
    if (!open) return;
    setMuted(true);
    setPlaybackStarted(!reduceMotion);
    revealChrome();
  }, [homeIndex, open, reduceMotion, revealChrome]);

  function handleTouchStart(event: React.TouchEvent) {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
    revealChrome();
  }

  function handleTouchEnd(event: React.TouchEvent) {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start == null) return;
    const end = event.changedTouches[0]?.clientX ?? start;
    const delta = end - start;
    if (delta > SWIPE_THRESHOLD_PX) goPrevious();
    else if (delta < -SWIPE_THRESHOLD_PX) goNext();
  }

  if (!open) return null;

  const showPlayer = Boolean(videoUrl) && playbackStarted;

  return (
    <div
      className="fixed inset-0 z-[80] bg-black"
      role="dialog"
      aria-modal="true"
      aria-label={`Video player: ${title}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative size-full">
        {showPlayer && videoUrl ? (
          <YouTubeEmbed
            key={`${home?.id ?? community.id}-${videoUrl}`}
            youtubeUrl={videoUrl}
            title={`${title} — ${community.name}`}
            preset="interactive"
            autoplay={shouldAutoplay}
            mute
            loop={false}
            loading="eager"
            fillContainer
            iframeRef={videoIframeRef}
            className="size-full"
          />
        ) : videoUrl ? (
          <YouTubePosterImage
            videoUrl={videoUrl}
            fallbackUrl={posterFallback}
            className="size-full"
            imgClassName="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center px-6 text-center text-[#b3b3b3]">
            <p>No video is available for this model yet.</p>
          </div>
        )}

        {!chromeVisible && (
          <div
            className="absolute inset-0 z-10"
            onMouseMove={revealChrome}
            onTouchStart={revealChrome}
            aria-hidden
          />
        )}

        {showPlayer && muted && (
          <button
            type="button"
            onClick={unmute}
            className="absolute left-1/2 top-1/2 z-30 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-white px-6 py-3 text-base font-bold text-[#141414] shadow-lg"
            aria-label="Unmute video"
          >
            <Volume2 className="size-5" />
            Unmute
          </button>
        )}

        {!showPlayer && videoUrl && (
          <button
            type="button"
            onClick={startPlayback}
            className="absolute left-1/2 top-1/2 z-30 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-white px-6 py-3 text-base font-bold text-[#141414] shadow-lg"
            aria-label={`Play ${title}`}
          >
            <Play className="size-5 fill-current" />
            Play
          </button>
        )}

        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent px-[4%] pb-16 transition-opacity duration-300",
            "pt-[max(0.75rem,env(safe-area-inset-top))]",
            chromeVisible ? "opacity-100" : "opacity-0",
          )}
        >
          <div
            className={cn(
              "flex items-start justify-between gap-4",
              chromeVisible && "pointer-events-auto",
            )}
            onMouseEnter={holdChrome}
            onMouseLeave={scheduleHide}
            onMouseMove={revealChrome}
          >
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-sm text-sm font-medium text-white transition-colors hover:text-white/80"
              aria-label="Close player"
              tabIndex={chromeVisible ? 0 : -1}
            >
              <ChevronLeft className="size-6" />
              <span className="hidden sm:inline">{community.name}</span>
            </button>

            <div className="flex items-center gap-2">
              {showPlayer && (
                <button
                  type="button"
                  onClick={() => {
                    if (muted) {
                      unmute();
                      return;
                    }
                    setMuted(true);
                    youtubeMute(videoIframeRef.current);
                  }}
                  tabIndex={chromeVisible ? 0 : -1}
                  className="rounded-full p-2 text-white transition-colors hover:bg-white/10"
                  aria-label={muted ? "Unmute" : "Mute"}
                >
                  {muted ? (
                    <VolumeX className="size-5" />
                  ) : (
                    <Volume2 className="size-5" />
                  )}
                </button>
              )}
              {watchUrl && (
                <a
                  href={watchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={chromeVisible ? 0 : -1}
                  className="inline-flex items-center gap-1.5 rounded-md border border-white/25 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/10 sm:text-sm"
                >
                  <ExternalLink className="size-3.5" />
                  YouTube
                </a>
              )}
              <button
                type="button"
                onClick={onClose}
                tabIndex={chromeVisible ? 0 : -1}
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
        </div>

        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-[4%] pt-16 transition-opacity duration-300",
            "pb-[max(1.25rem,env(safe-area-inset-bottom))]",
            chromeVisible ? "opacity-100" : "opacity-0",
          )}
        >
          <div
            className={cn(
              "flex flex-wrap items-center justify-between gap-3",
              chromeVisible && "pointer-events-auto",
            )}
            onMouseEnter={holdChrome}
            onMouseLeave={scheduleHide}
            onMouseMove={revealChrome}
          >
            <div className="flex flex-wrap items-center gap-3">
              {hasPrevious && (
                <button
                  type="button"
                  onClick={goPrevious}
                  tabIndex={chromeVisible ? 0 : -1}
                  className="inline-flex items-center gap-2 rounded bg-[rgba(109,109,110,0.7)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[rgba(109,109,110,0.55)]"
                >
                  Previous model
                </button>
              )}
              {hasNext && (
                <button
                  type="button"
                  onClick={goNext}
                  tabIndex={chromeVisible ? 0 : -1}
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
            <p className="text-xs text-[#b3b3b3]">
              {coarse
                ? "Swipe to change models. Unmute for sound."
                : "Volume, captions (CC), quality & fullscreen — use the YouTube controls on the video"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
