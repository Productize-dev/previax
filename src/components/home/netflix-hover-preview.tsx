"use client";

import { useEffect, useState } from "react";

import { YouTubePosterImage } from "@/components/communities/youtube-poster-image";
import { VideoQuickActions } from "@/components/video/video-quick-actions";
import { usePrefersCoarsePointer } from "@/hooks/use-prefers-coarse-pointer";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import {
  extractYouTubeId,
  getEmbedUrl,
  YOUTUBE_PREVIEW_IFRAME_ALLOW,
} from "@/lib/youtube";
import { cn } from "@/lib/utils";

const IFRAME_MOUNT_DELAY_MS = 150;

type NetflixHoverPreviewProps = {
  youtubeUrl?: string;
  posterUrl?: string;
  active: boolean;
  title?: string;
  className?: string;
  /** Show Watch / YouTube actions when the tile is expanded. */
  showActions?: boolean;
  onOpenPlayer?: () => void;
};

/** Muted loop preview on hover — skipped on touch / reduced-motion. */
export function NetflixHoverPreview({
  youtubeUrl,
  posterUrl,
  active,
  title,
  className,
  showActions = false,
  onOpenPlayer,
}: NetflixHoverPreviewProps) {
  const coarse = usePrefersCoarsePointer();
  const reduceMotion = usePrefersReducedMotion();
  const [iframeReady, setIframeReady] = useState(false);

  const videoId = youtubeUrl ? extractYouTubeId(youtubeUrl) : null;
  const embedUrl = videoId
    ? getEmbedUrl(videoId, { preset: "preview" })
    : null;
  const allowIframe = active && Boolean(embedUrl) && !coarse && !reduceMotion;

  useEffect(() => {
    if (!allowIframe) {
      setIframeReady(false);
      return;
    }

    const timer = setTimeout(() => setIframeReady(true), IFRAME_MOUNT_DELAY_MS);
    return () => {
      clearTimeout(timer);
      setIframeReady(false);
    };
  }, [allowIframe]);

  const showVideo = allowIframe && iframeReady && embedUrl;

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      {youtubeUrl || posterUrl ? (
        <YouTubePosterImage
          videoUrl={youtubeUrl}
          fallbackUrl={posterUrl}
          className={cn(
            "absolute inset-0 size-full transition-opacity duration-300",
            showVideo ? "opacity-0" : "opacity-100",
          )}
          imgClassName="object-cover object-center"
        />
      ) : null}
      {showVideo && (
        <iframe
          src={embedUrl}
          title={title ? `${title} preview` : "Video preview"}
          allow={YOUTUBE_PREVIEW_IFRAME_ALLOW}
          loading="lazy"
          className="pointer-events-none absolute top-1/2 left-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2 scale-110 opacity-100 transition-opacity duration-300"
        />
      )}
      {active && showActions && (youtubeUrl || onOpenPlayer) && (
        <div className="absolute bottom-2 left-2 right-2 z-20">
          <VideoQuickActions
            youtubeUrl={youtubeUrl}
            title={title}
            onOpenPlayer={onOpenPlayer}
          />
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
    </div>
  );
}
