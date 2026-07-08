"use client";

import { useEffect } from "react";
import { Play, X } from "lucide-react";

import {
  formatModelMeta,
  getHomeDisplayName,
  getModelPosterSources,
} from "@/lib/community-media";
import {
  getCommunityModelCount,
  getCommunityYear,
  truncateMainHighlight,
} from "@/lib/community-detail";
import type { Community, Home } from "@/lib/types";
import { YouTubePosterImage } from "@/components/communities/youtube-poster-image";
import { cn } from "@/lib/utils";

type NetflixModelsBrowserProps = {
  open: boolean;
  community: Community;
  models: Home[];
  selectedHomeId?: string | null;
  onClose: () => void;
  onSelectModel: (home: Home, index: number) => void;
};

export function NetflixModelsBrowser({
  open,
  community,
  models,
  selectedHomeId,
  onClose,
  onSelectModel,
}: NetflixModelsBrowserProps) {
  const year = getCommunityYear(community);
  const modelCount = getCommunityModelCount(community);
  const highlight = community.mainHighlight
    ? truncateMainHighlight(community.mainHighlight)
    : null;

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex bg-[#141414] text-white">
      <aside className="hidden w-[min(32vw,360px)] shrink-0 flex-col border-r border-white/10 px-6 py-8 md:flex">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#46d369]">
            Previax
          </p>
          <h2 className="mt-3 text-2xl font-bold leading-tight">
            {community.name}
          </h2>
          <p className="mt-2 text-sm text-[#b3b3b3]">
            {year}
            {highlight ? ` · ${highlight}` : ""}
          </p>
        </div>

        <nav className="mt-10 space-y-2">
          <button
            type="button"
            className="flex w-full items-center justify-between rounded bg-white/15 px-4 py-3 text-left text-sm font-semibold text-white"
          >
            <span>Models</span>
            <span className="text-[#b3b3b3]">
              {modelCount} model{modelCount === 1 ? "" : "s"}
            </span>
          </button>
        </nav>
      </aside>

      <main className="relative min-w-0 flex-1 overflow-y-auto px-[4%] py-8 md:py-10">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-[4%] top-6 rounded-full p-2 text-white transition-colors hover:bg-white/10 md:top-8"
          aria-label="Close models"
        >
          <X className="size-6" />
        </button>

        <div className="max-w-5xl pr-10">
          <div className="md:hidden">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#46d369]">
              {community.name}
            </p>
          </div>

          <h1 className="mt-2 text-3xl font-bold md:mt-0 md:text-4xl">Models</h1>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#b3b3b3]">
            <span>{year}</span>
            {highlight && (
              <>
                <span aria-hidden>·</span>
                <span>{highlight}</span>
              </>
            )}
            <span aria-hidden>·</span>
            <span>
              {modelCount} model{modelCount === 1 ? "" : "s"}
            </span>
          </div>

          {models.length === 0 ? (
            <p className="mt-10 text-[#b3b3b3]">
              No models are available in this community yet.
            </p>
          ) : (
            <div className="mt-8 space-y-8 md:mt-10 md:space-y-10">
              {models.map((home, index) => {
                const title = getHomeDisplayName(home, index);
                const isSelected = selectedHomeId === home.id;
                const poster = getModelPosterSources(home, community);

                return (
                  <button
                    key={home.id}
                    type="button"
                    onClick={() => onSelectModel(home, index)}
                    className={cn(
                      "group flex w-full gap-4 text-left transition-opacity md:gap-6",
                      "hover:opacity-100",
                      isSelected ? "opacity-100" : "opacity-90",
                    )}
                  >
                    <div className="relative w-[38vw] max-w-[280px] shrink-0 overflow-hidden rounded-md bg-[#2f2f2f] shadow-lg md:w-[320px]">
                      <YouTubePosterImage
                        videoUrl={poster.videoUrl}
                        fallbackUrl={poster.fallbackUrl}
                        className="aspect-video"
                      />
                      <span className="absolute bottom-2 left-2 rounded bg-black/75 px-1.5 py-0.5 text-[0.7rem] font-semibold text-white">
                        M{index + 1}
                      </span>
                      <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/25">
                        <span className="flex size-12 items-center justify-center rounded-full bg-white/90 text-[#141414] opacity-0 transition-opacity group-hover:opacity-100">
                          <Play className="size-5 fill-current pl-0.5" />
                        </span>
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 pt-1">
                      <h3 className="text-lg font-bold text-white md:text-2xl">
                        {title}
                      </h3>
                      <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-[#d2d2d2] md:text-base">
                        {home.description}
                      </p>
                      <p className="mt-3 text-sm text-[#b3b3b3]">
                        {formatModelMeta(home)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
