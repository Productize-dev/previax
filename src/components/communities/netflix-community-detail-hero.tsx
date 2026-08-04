"use client";

import { useRef, useState } from "react";
import { LayoutGrid, Play, Volume2, VolumeX } from "lucide-react";

import { YouTubePosterImage } from "@/components/communities/youtube-poster-image";
import {
  YouTubeEmbed,
  youtubeMute,
  youtubeUnmute,
} from "@/components/video/youtube-embed";
import { useData } from "@/context/data-context";
import {
  buildCommunityCast,
  buildCommunityShortDescription,
  getCommunityModelCount,
  getCommunityYear,
  truncateMainHighlight,
} from "@/lib/community-detail";
import {
  getCommunityHeroPosterUrl,
  getCommunityHeroVideoUrl,
} from "@/lib/community-media";
import { getCommunityBuilderNames } from "@/lib/community-builders";
import { getCommunityTagLabel } from "@/lib/tag-labels";
import { getTop10Rank } from "@/lib/top-10-communities";
import type { Community } from "@/lib/types";
import { cn } from "@/lib/utils";

type NetflixCommunityDetailHeroProps = {
  community: Community;
  onPlayBuilders: () => void;
  onOpenModels: () => void;
  hasModels: boolean;
};

function CastLine({ names }: { names: string[] }) {
  const visible = names.slice(0, 3);
  const hasMore = names.length > 3;
  const visibleText = visible.join(", ");

  return (
    <p className="group relative max-w-2xl text-sm text-[#d2d2d2]">
      <span className="font-semibold text-white">Builders & Lenders: </span>
      <span>{visibleText}</span>
      {hasMore && <span className="text-[#b3b3b3]">…</span>}
      {hasMore && (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-0 top-full z-50 mt-2 hidden max-w-md rounded bg-[#2f2f2f] px-3 py-2 text-sm leading-relaxed text-white shadow-xl group-hover:block"
        >
          {names.join(", ")}
        </span>
      )}
    </p>
  );
}

export function NetflixCommunityDetailHero({
  community,
  onPlayBuilders,
  onOpenModels,
  hasModels,
}: NetflixCommunityDetailHeroProps) {
  const { top10Communities, customCommunityTagLabels } = useData();
  /** Browsers block unmuted autoplay — start muted, unmute on user click. */
  const [muted, setMuted] = useState(true);
  const videoIframeRef = useRef<HTMLIFrameElement>(null);

  const year = getCommunityYear(community);
  const highlight = community.mainHighlight
    ? truncateMainHighlight(community.mainHighlight)
    : null;
  const shortDescription = buildCommunityShortDescription(community);
  const cast = buildCommunityCast(community);
  const top10Rank = getTop10Rank(community.id, top10Communities);
  const modelCount = getCommunityModelCount(community);
  const heroVideoUrl = getCommunityHeroVideoUrl(community);
  const heroPosterFallback = getCommunityHeroPosterUrl(community);
  const tagLabels = (community.tags ?? [])
    .slice(0, 3)
    .map((tag) => getCommunityTagLabel(tag, customCommunityTagLabels));

  const playLabel = hasModels
    ? `Play ${getCommunityBuilderNames(community)[0] ?? "builders"}`
    : "Play community tour";

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    if (next) {
      youtubeMute(videoIframeRef.current);
    } else {
      youtubeUnmute(videoIframeRef.current);
    }
  }

  return (
    <section className="relative min-h-[88vh] overflow-hidden bg-[#141414] text-white md:min-h-screen">
      <div className="absolute inset-0">
        {heroVideoUrl ? (
          <>
            <YouTubePosterImage
              videoUrl={heroVideoUrl}
              fallbackUrl={heroPosterFallback}
              className="size-full"
              imgClassName="object-cover object-[center_20%] md:object-top scale-[1.02]"
            />
            <YouTubeEmbed
              youtubeUrl={heroVideoUrl}
              title={community.name}
              preset="background"
              autoplay
              mute
              loop
              loading="eager"
              fillContainer
              cover
              iframeRef={videoIframeRef}
              className="absolute inset-0 size-full"
            />
          </>
        ) : (
          <YouTubePosterImage
            videoUrl={heroVideoUrl}
            fallbackUrl={heroPosterFallback}
            className="size-full"
            imgClassName="object-cover object-[center_20%] md:object-top scale-[1.02]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/55 to-[#141414]/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/45 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(20,20,20,0.15),rgba(20,20,20,0.85)_68%)]" />
      </div>

      {heroVideoUrl && (
        <button
          type="button"
          onClick={toggleMute}
          className="absolute bottom-[18%] right-[4%] z-20 inline-flex size-11 items-center justify-center rounded-full border border-white/40 bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70 md:bottom-24"
          aria-label={muted ? "Unmute community video" : "Mute community video"}
          title={muted ? "Unmute" : "Mute"}
        >
          {muted ? (
            <VolumeX className="size-5" />
          ) : (
            <Volume2 className="size-5" />
          )}
        </button>
      )}

      <div className="relative z-10 flex min-h-[88vh] flex-col justify-end px-[4%] pb-10 pt-28 md:min-h-screen md:pb-16">
        <div className="max-w-3xl space-y-4">
          <h1 className="font-heading text-4xl font-bold tracking-tight text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.55)] md:text-6xl lg:text-7xl">
            {community.name}
          </h1>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-[#bcbcbc]">
            <span className="font-semibold text-[#46d369]">{year}</span>
            {tagLabels.map((label) => (
              <span key={label} className="flex items-center gap-x-2">
                <span aria-hidden>·</span>
                <span>{label}</span>
              </span>
            ))}
            {modelCount > 0 && (
              <span className="flex items-center gap-x-2">
                <span aria-hidden>·</span>
                <span>
                  {modelCount} model{modelCount === 1 ? "" : "s"}
                </span>
              </span>
            )}
            {highlight && (
              <span className="flex items-center gap-x-2">
                <span aria-hidden>·</span>
                <span>{highlight}</span>
              </span>
            )}
          </div>

          {top10Rank !== null && (
            <div className="flex items-center gap-3 text-sm font-semibold">
              <span className="inline-flex h-10 w-8 shrink-0 flex-col items-center justify-center bg-[#e50914] text-[0.62rem] font-black leading-[0.95] tracking-tight text-white">
                <span>TOP</span>
                <span>10</span>
              </span>
              <span className="text-base text-white">
                #{top10Rank} in Communities Today
              </span>
            </div>
          )}

          <p className="max-w-2xl text-base leading-relaxed text-[#d2d2d2] md:text-lg">
            {shortDescription}
          </p>

          {cast.length > 0 && <CastLine names={cast} />}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onPlayBuilders}
              className={cn(
                "inline-flex items-center gap-2 rounded bg-white px-6 py-2.5 text-base font-bold text-[#141414] transition-colors",
                "hover:bg-white/85",
              )}
              aria-label={playLabel}
            >
              <Play className="size-5 fill-current" />
              {playLabel}
            </button>

            <button
              type="button"
              onClick={onOpenModels}
              className={cn(
                "inline-flex items-center gap-2 rounded border border-[#6d6d6e] bg-[rgba(42,42,42,0.75)] px-5 py-2.5 text-base font-semibold text-white backdrop-blur-sm transition-colors",
                "hover:border-white hover:bg-[rgba(58,58,58,0.85)]",
              )}
            >
              <LayoutGrid className="size-5" />
              Models &amp; More
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
