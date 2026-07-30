"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useCallback } from "react";
import { Play } from "lucide-react";

import { TileActionBar } from "@/components/home/tile-action-bar";
import { NetflixHoverPreview } from "@/components/home/netflix-hover-preview";
import {
  NetflixRankMark,
  NetflixStatusBar,
  NetflixTileBadges,
} from "@/components/home/netflix-tile-badges";
import { VideoQuickActions } from "@/components/video/video-quick-actions";
import { useData } from "@/context/data-context";
import {
  getAvailableHomeCount,
  getPriceRange,
  hasActiveOffers,
} from "@/lib/community-utils";
import { getCommunityHeroPosterUrl } from "@/lib/community-media";
import { getCommunityTileBadges } from "@/lib/netflix-tile-badges";
import { getTop10Rank } from "@/lib/top-10-communities";
import type { Community } from "@/lib/types";
import { cn } from "@/lib/utils";

import { useNetflixRowSelection } from "./use-netflix-row-selection";

type NetflixCommunityRowProps = {
  title: string;
  id?: string;
  communities: Community[];
  defaultIndex?: number;
  onSelect?: (community: Community) => void;
  onDeselect?: () => void;
  className?: string;
  /** Netflix Top 10 style with large rank numerals */
  variant?: "default" | "top10";
};

export const NetflixCommunityRow = memo(function NetflixCommunityRow({
  title,
  id,
  communities,
  defaultIndex = -1,
  onSelect,
  onDeselect,
  className,
  variant = "default",
}: NetflixCommunityRowProps) {
  const router = useRouter();
  const { top10Communities, customCommunityTagLabels } = useData();
  const isTop10 = variant === "top10";

  const openCommunity = useCallback(
    (community: Community) => {
      router.push(`/communities/${community.id}`);
    },
    [router],
  );

  const {
    selectedIndex,
    selectIndex,
    selectOnHover,
    handleTrackMouseLeave,
    handleTileMouseLeave,
    trackRef,
    itemRefs,
  } = useNetflixRowSelection({
    items: communities,
    defaultIndex,
    onSelect,
    onDeselect,
  });

  if (communities.length === 0) return null;

  return (
    <section
      id={id}
      className={cn("netflix-row-section group/row", className)}
    >
      <h2 className="netflix-row-title">{title}</h2>
      <div
        ref={trackRef}
        className="netflix-focus-track"
        tabIndex={0}
        role="listbox"
        aria-label={title}
        aria-activedescendant={
          selectedIndex >= 0
            ? `${id ?? title}-item-${selectedIndex}`
            : undefined
        }
        onMouseLeave={handleTrackMouseLeave}
      >
        {communities.map((community, index) => {
          const selected = index === selectedIndex;
          const priceRange = getPriceRange(community);
          const homeCount = getAvailableHomeCount(community);
          const offers = hasActiveOffers(community);
          const year = new Date(community.createdAt).getFullYear();
          const rank =
            (isTop10 ? index + 1 : null) ??
            getTop10Rank(community.id, top10Communities);
          const poster = getCommunityHeroPosterUrl(community);
          const badges = getCommunityTileBadges(community, {
            top10Rank: isTop10 ? null : rank,
            tagLabels: customCommunityTagLabels,
            maxTags: selected ? 3 : 1,
          }).filter((badge) => !(isTop10 && badge.id === "top10"));
          const statusLabel = offers ? "Builder Offers" : null;
          const overlayBadges = badges.filter(
            (badge) => !(statusLabel && badge.id === "offers"),
          );

          return (
            <div
              key={community.id}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              id={`${id ?? title}-item-${index}`}
              role="option"
              aria-selected={selected}
              className={cn(
                "netflix-focus-tile",
                selected
                  ? "netflix-focus-tile--selected"
                  : "netflix-focus-tile--portrait",
                isTop10 && "netflix-focus-tile--top10",
              )}
              onMouseEnter={() => selectOnHover(index)}
              onMouseLeave={handleTileMouseLeave}
              onFocus={() => selectIndex(index, { immediate: true })}
            >
              {isTop10 && !selected && rank != null && (
                <NetflixRankMark rank={rank} />
              )}

              <Link
                href={`/communities/${community.id}`}
                onClick={(e) => {
                  if (!selected) {
                    e.preventDefault();
                    selectIndex(index, { immediate: true });
                  }
                }}
                className={cn(
                  "netflix-tile-link relative z-10 block w-full outline-none",
                  isTop10 && !selected && "pl-5 sm:pl-6",
                )}
                aria-label={community.name}
              >
                <div
                  className={cn(
                    "netflix-tile-media overflow-hidden border-2 bg-[#2f2f2f]",
                    selected
                      ? "netflix-tile-media--landscape border-white"
                      : "netflix-tile-media--portrait border-transparent ring-1 ring-white/10",
                  )}
                >
                  <NetflixHoverPreview
                    youtubeUrl={community.youtubeUrl}
                    posterUrl={poster}
                    active={selected}
                    title={community.name}
                  />

                  {!selected && (
                    <NetflixTileBadges badges={overlayBadges} compact />
                  )}

                  {!selected && statusLabel && (
                    <NetflixStatusBar label={statusLabel} />
                  )}

                  {!selected && !statusLabel && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/95 via-black/55 to-transparent px-3 pb-3 pt-12">
                      <p className="line-clamp-2 font-sans text-base font-semibold leading-snug text-white sm:text-lg">
                        {community.name}
                      </p>
                    </div>
                  )}
                </div>

                <div
                  className={cn(
                    "netflix-tile-details",
                    selected && "netflix-tile-details--open",
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="mt-3 font-sans text-lg font-semibold text-white sm:text-xl">
                      {community.name}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {badges.slice(0, 4).map((badge) => (
                        <span
                          key={badge.id}
                          className="rounded-[2px] bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#d2d2d2]"
                        >
                          {badge.label}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-[#bcbcbc] sm:text-sm">
                      {community.city}, NC
                      <span className="mx-1.5">•</span>
                      {year}
                      {homeCount > 0 && (
                        <>
                          <span className="mx-1.5">•</span>
                          {homeCount} home{homeCount !== 1 ? "s" : ""}
                        </>
                      )}
                      {offers && (
                        <>
                          <span className="mx-1.5">•</span>
                          <span className="text-[#46d369]">Offers</span>
                        </>
                      )}
                    </p>
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#d2d2d2] sm:line-clamp-3 sm:text-sm">
                      {community.description ||
                        community.tagline ||
                        `${community.builderName} community in ${community.city}.`}
                    </p>
                    {priceRange && (
                      <p className="mt-2 text-xs font-semibold text-white sm:text-sm">
                        {priceRange.label}
                      </p>
                    )}
                  </div>
                </div>
              </Link>

              {selected && (
                <div className="pointer-events-none absolute inset-x-0 top-0 z-20 aspect-video">
                  <div className="pointer-events-auto absolute left-2 top-2">
                    <TileActionBar communityId={community.id} />
                  </div>
                  <div className="pointer-events-none absolute left-2 right-2 top-12 z-10">
                    <NetflixTileBadges
                      badges={badges}
                      className="static inset-auto p-0"
                    />
                  </div>
                  {community.youtubeUrl && (
                    <>
                      <div className="pointer-events-auto absolute bottom-2 left-2 right-2">
                        <VideoQuickActions
                          youtubeUrl={community.youtubeUrl}
                          title={community.name}
                          onOpenPlayer={() => openCommunity(community)}
                        />
                      </div>
                      <Link
                        href={`/communities/${community.id}`}
                        className="pointer-events-auto absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 hover:opacity-100 focus-visible:opacity-100"
                        aria-label={`Open ${community.name} community page`}
                      >
                        <span className="flex size-12 items-center justify-center rounded-full bg-white text-black shadow-lg">
                          <Play className="size-5 fill-black" />
                        </span>
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
});
