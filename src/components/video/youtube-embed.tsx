"use client";

import {
  extractYouTubeId,
  getEmbedUrl,
  YOUTUBE_IFRAME_ALLOW,
  YOUTUBE_PREVIEW_IFRAME_ALLOW,
  type YouTubeEmbedPreset,
} from "@/lib/youtube";
import { cn } from "@/lib/utils";

type YouTubeEmbedProps = {
  youtubeUrl: string;
  title: string;
  preset?: YouTubeEmbedPreset;
  autoplay?: boolean;
  mute?: boolean;
  loop?: boolean;
  controls?: boolean;
  captions?: boolean;
  className?: string;
  iframeClassName?: string;
  /** Background/preview tiles block pointer events by default. */
  pointerEvents?: "none" | "auto";
  loading?: "eager" | "lazy";
  /** Fill parent instead of forcing 16:9 box. */
  fillContainer?: boolean;
  /** Crop iframe to cover container (hero backgrounds). */
  cover?: boolean;
};

export function YouTubeEmbed({
  youtubeUrl,
  title,
  preset = "interactive",
  autoplay,
  mute,
  loop,
  controls,
  captions,
  className,
  iframeClassName,
  pointerEvents = preset === "interactive" ? "auto" : "none",
  loading = "lazy",
  fillContainer = false,
  cover = false,
}: YouTubeEmbedProps) {
  const videoId = extractYouTubeId(youtubeUrl);

  if (!videoId) {
    return (
      <div
        className={cn(
          "flex aspect-video items-center justify-center bg-[#1a1a1a] text-[#b3b3b3]",
          className,
        )}
        role="status"
      >
        Video unavailable
      </div>
    );
  }

  const embedUrl = getEmbedUrl(videoId, {
    preset,
    autoplay,
    mute,
    loop,
    controls,
    captions,
  });

  const allow =
    preset === "interactive"
      ? YOUTUBE_IFRAME_ALLOW
      : YOUTUBE_PREVIEW_IFRAME_ALLOW;

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-black",
        fillContainer ? "size-full" : "aspect-video",
        className,
      )}
    >
      <iframe
        src={embedUrl}
        title={title}
        allow={allow}
        allowFullScreen={preset === "interactive"}
        loading={loading}
        className={cn(
          "absolute border-0",
          cover
            ? "pointer-events-none top-1/2 left-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2 scale-105"
            : "inset-0 size-full",
          pointerEvents === "none" && !cover && "pointer-events-none",
          iframeClassName,
        )}
      />
    </div>
  );
}
