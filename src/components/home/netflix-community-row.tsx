"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useCallback } from "react";
import { Play } from "lucide-react";

import { TileActionBar } from "@/components/home/tile-action-bar";
import { NetflixHoverPreview } from "@/components/home/netflix-hover-preview";
import { NetflixRowChevrons } from "@/components/home/netflix-row-chevrons";
import {
  NetflixRankMark,
  NetflixStatusBar,
  NetflixTileBadges,
} from "@/components/home/netflix-tile-badges";
import { VideoQuickActions } from "@/components/video/video-quick-actions";
import { useData } from "@/context/data-context";
import { usePrefersCoarsePointer } from "@/hooks/use-prefers-coarse-pointer";
import {
  getAvailableHomeCount,
  getPriceRange,
  hasActiveOffers,
} from "@/lib/community-utils";
import { getCommunityHeroPosterUrl } from "@/lib/community-media";
import { getCommunityTileBadges } from "@/lib/netflix-tile-badges";
import { getTop10Rank } from "@/lib/top-10-communities";
import type { Community } from "@/lib/types";
import { communityPlayHref } from "@/lib/routes";
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
  const coarse = usePrefersCoarsePointer();
  const { top10Communities, customCommunityTagLabels } = useData();
  const isTop10 = variant === "top10";

  const openCommunityPlayer = useCallback(
    (community: Community) => {
      router.push(communityPlayHref(community.id));
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
    enableHoverSelect: !coarse,
  });

  if (communities.length === 0) return null;

  return (
    <section
      id={id}
      className={cn("netflix-row-section group/row", className)}
    >
      <h2 className="netflix-row-title">{title}</h2>
      <div className="relative">
        <NetflixRowChevrons trackRef={trackRef} />
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
          const rank =
            (isTop10 ? index + 1 : null) ??
            getTop10Rank(community.id, top10Communities);
          const poster = getCommunityHeroPosterUrl(community);
          const badges = getCommunityTileBadges(community, {
            top10Rank: isTop10 ? null : rank,
            tagLabels: customCommunityTagLabels,
            maxTags: selected ? 2 : 0,
          }).filter((badge) => !(isTop10 && badge.id === "top10"));
          const statusLabel = offers ? "Offers" : null;
          const overlayBadges = badges.filter(
            (badge) =>
              badge.id === "new" ||
              (!(statusLabel && badge.id === "offers") && badge.tone !== "tag"),
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
              onFocus={() => {
                if (!coarse) selectIndex(index, { immediate: true });
              }}
            >
              {isTop10 && !selected && rank != null && (
                <NetflixRankMark rank={rank} />
              )}

              <Link
                href={`/communities/${community.id}`}
                onClick={(e) => {
                  if (!coarse && !selected) {
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
                    "netflix-tile-media overflow-hidden bg-[#2f2f2f]",
                    selected
                      ? "netflix-tile-media--landscape ring-1 ring-white/40"
                      : "netflix-tile-media--portrait",
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

                  {!selected && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-3 pb-2.5 pt-10">
                      <p className="line-clamp-1 font-sans text-sm font-semibold leading-snug text-white sm:text-base">
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
                    <p className="mt-2.5 font-sans text-base font-semibold text-white sm:text-lg">
                      {community.name}
                    </p>
                    <p className="mt-1.5 text-xs text-[#b3b3b3] sm:text-sm">
                      {community.city}, NC
                      {homeCount > 0 && (
                        <>
                          <span className="mx-1.5 text-white/30">•</span>
                          {homeCount} home{homeCount !== 1 ? "s" : ""}
                        </>
                      )}
                      {priceRange && (
                        <>
                          <span className="mx-1.5 text-white/30">•</span>
                          {priceRange.label}
                        </>
                      )}
                      {offers && (
                        <>
                          <span className="mx-1.5 text-white/30">•</span>
                          <span className="text-[#46d369]">Offers</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </Link>

              {(selected || (coarse && community.youtubeUrl)) && (
                <div className="pointer-events-none absolute inset-x-0 top-0 z-20 aspect-video">
                  {selected && (
                    <div className="pointer-events-auto absolute left-2 top-2">
                      <TileActionBar communityId={community.id} />
                    </div>
                  )}
                  {community.youtubeUrl && (
                    <>
                      {selected && (
                        <div className="pointer-events-auto absolute bottom-2 left-2 right-2">
                          <VideoQuickActions
                            youtubeUrl={community.youtubeUrl}
                            title={community.name}
                            onOpenPlayer={() => openCommunityPlayer(community)}
                          />
                        </div>
                      )}
                      <Link
                        href={communityPlayHref(community.id)}
                        className={cn(
                          "pointer-events-auto flex items-center justify-center transition-opacity duration-300",
                          coarse
                            ? "absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 opacity-100"
                            : "absolute inset-0 opacity-0 hover:opacity-100 focus-visible:opacity-100",
                        )}
                        aria-label={`Play ${community.name} video`}
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
      </div>
    </section>
  );
});
