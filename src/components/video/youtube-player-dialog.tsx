"use client";

import { useEffect } from "react";
import { ExternalLink, X } from "lucide-react";

import { YouTubeEmbed } from "@/components/video/youtube-embed";
import { getWatchUrl } from "@/lib/youtube";
import { cn } from "@/lib/utils";

type YouTubePlayerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  youtubeUrl: string;
  title: string;
  subtitle?: string;
  className?: string;
};

/** Full-screen player with native YouTube controls (volume, captions, quality, fullscreen). */
export function YouTubePlayerDialog({
  open,
  onOpenChange,
  youtubeUrl,
  title,
  subtitle,
  className,
}: YouTubePlayerDialogProps) {
  const watchUrl = getWatchUrl(youtubeUrl);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onOpenChange, open]);

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[90] flex flex-col bg-black",
        className,
      )}
      role="dialog"
      aria-modal="true"
      aria-label={`Video player: ${title}`}
    >
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-[4%] py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{title}</p>
          {subtitle && (
            <p className="truncate text-xs text-[#b3b3b3]">{subtitle}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {watchUrl && (
            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-white/20 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/10 sm:text-sm"
            >
              <ExternalLink className="size-3.5" />
              Open in YouTube
            </a>
          )}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full p-2 text-white transition-colors hover:bg-white/10"
            aria-label="Close video player"
          >
            <X className="size-5" />
          </button>
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        <YouTubeEmbed
          youtubeUrl={youtubeUrl}
          title={title}
          preset="interactive"
          autoplay
          mute={false}
          loop={false}
          loading="eager"
          fillContainer
          className="size-full"
        />
      </div>

      <footer className="shrink-0 border-t border-white/10 px-[4%] py-2.5 text-center text-xs text-[#808080]">
        Use YouTube controls for volume, captions (CC), quality, and fullscreen
      </footer>
    </div>
  );
}
