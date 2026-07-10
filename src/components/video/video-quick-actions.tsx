"use client";

import { ExternalLink, Maximize2, Volume2 } from "lucide-react";

import { getWatchUrl } from "@/lib/youtube";
import { cn } from "@/lib/utils";

type VideoQuickActionsProps = {
  youtubeUrl?: string;
  title?: string;
  onOpenPlayer?: () => void;
  className?: string;
};

/** Accessible actions for hover previews — open full player or YouTube. */
export function VideoQuickActions({
  youtubeUrl,
  title,
  onOpenPlayer,
  className,
}: VideoQuickActionsProps) {
  const watchUrl = youtubeUrl ? getWatchUrl(youtubeUrl) : null;

  if (!watchUrl && !onOpenPlayer) return null;

  return (
    <div
      className={cn(
        "pointer-events-auto flex flex-wrap items-center gap-1.5",
        className,
      )}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {onOpenPlayer && youtubeUrl && (
        <button
          type="button"
          onClick={onOpenPlayer}
          className="inline-flex items-center gap-1.5 rounded-sm bg-white/95 px-2.5 py-1.5 text-[11px] font-bold text-black shadow-md transition-colors hover:bg-white sm:text-xs"
          aria-label={`Play ${title ?? "video"} with sound and controls`}
        >
          <Volume2 className="size-3.5" />
          <Maximize2 className="size-3.5" />
          Watch
        </button>
      )}
      {watchUrl && (
        <button
          type="button"
          onClick={() => window.open(watchUrl, "_blank", "noopener,noreferrer")}
          className="inline-flex items-center gap-1 rounded-sm border border-white/40 bg-black/70 px-2.5 py-1.5 text-[11px] font-semibold text-white backdrop-blur transition-colors hover:bg-black/90 sm:text-xs"
          aria-label={`Open ${title ?? "video"} on YouTube`}
        >
          <ExternalLink className="size-3.5" />
          YouTube
        </button>
      )}
    </div>
  );
}
