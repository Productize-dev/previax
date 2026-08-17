"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useCallback } from "react";
import { Play } from "lucide-react";

import { HomeListingCategoryBadges } from "@/components/homes/home-listing-category-badges";
import { TileActionBar } from "@/components/home/tile-action-bar";
import { NetflixHoverPreview } from "@/components/home/netflix-hover-preview";
import {
  NetflixStatusBar,
  NetflixTileBadges,
} from "@/components/home/netflix-tile-badges";
import { VideoQuickActions } from "@/components/video/video-quick-actions";
import type { HomeRowItem } from "@/lib/homepage-sections";
import { pricePerSqft } from "@/lib/community-utils";
import { getHomePosterUrl } from "@/lib/community-media";
import { getHomeListingCategories, HOME_LISTING_CATEGORY_LABELS } from "@/lib/home-listing-categories";
import { getHomeTileBadges } from "@/lib/netflix-tile-badges";
import { communityPlayHref } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { usePrefersCoarsePointer } from "@/hooks/use-prefers-coarse-pointer";

import { useNetflixRowSelection } from "./use-netflix-row-selection";

export type { HomeRowItem };

type NetflixHomeRowProps = {
  title: string;
  id?: string;
  items: HomeRowItem[];
  defaultIndex?: number;
  onSelect?: (item: HomeRowItem) => void;
  onDeselect?: () => void;
  className?: string;
};

export const NetflixHomeRow = memo(function NetflixHomeRow({
  title,
  id,
  items,
  defaultIndex = -1,
  onSelect,
  onDeselect,
  className,
}: NetflixHomeRowProps) {
  const router = useRouter();
  const coarse = usePrefersCoarsePointer();

  const openModelPlayer = useCallback(
    (communityId: string, homeId: string) => {
      router.push(communityPlayHref(communityId, homeId));
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
    items,
    defaultIndex,
    onSelect,
    onDeselect,
    enableHoverSelect: !coarse,
  });

  if (items.length === 0) return null;

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
        onMouseLeave={handleTrackMouseLeave}
      >
        {items.map(({ home, community }, index) => {
          const selected = index === selectedIndex;
          const cover = getHomePosterUrl(home, community);
          const ppsf = pricePerSqft(home);
          const categories = getHomeListingCategories(home, community);
          const previewUrl = home.youtubeUrl || community.youtubeUrl;
          const badges = getHomeTileBadges(home, community);
          const statusLabel = badges.find((b) => b.id === "offers" || b.id === "ready")
            ?.label;
          const overlayBadges = badges.filter(
            (b) => b.id !== "offers" && b.id !== "ready",
          );

          return (
            <div
              key={`${community.id}-${home.id}`}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              role="option"
              aria-selected={selected}
              className={cn(
                "netflix-focus-tile",
                selected
                  ? "netflix-focus-tile--selected"
                  : "netflix-focus-tile--portrait",
              )}
              onMouseEnter={() => selectOnHover(index)}
              onMouseLeave={handleTileMouseLeave}
              onFocus={() => {
                if (!coarse) selectIndex(index, { immediate: true });
              }}
            >
              <Link
                href={`/communities/${community.id}/homes/${home.id}`}
                onClick={(e) => {
                  if (!coarse && !selected) {
                    e.preventDefault();
                    selectIndex(index, { immediate: true });
                  }
                }}
                className="netflix-tile-link block w-full outline-none"
                aria-label={`${community.name} — $${home.price.toLocaleString()}`}
              >
                <div
                  className={cn(
                    "netflix-tile-media overflow-hidden border-2 bg-[#2f2f2f]",
                    selected
                      ? "netflix-tile-media--landscape border-white"
                      : "netflix-tile-media--portrait border-transparent ring-1 ring-white/10",
                  )}
                >
                  {cover || previewUrl ? (
                    <NetflixHoverPreview
                      youtubeUrl={previewUrl}
                      posterUrl={cover}
                      active={selected}
                      title={home.modelName || community.name}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-[#808080]">
                      No image
                    </div>
                  )}
                  {!selected && (
                    <NetflixTileBadges
                      badges={[
                        ...overlayBadges,
                        ...categories.slice(0, 1).map((category) => ({
                          id: `cat-${category}`,
                          label: HOME_LISTING_CATEGORY_LABELS[category],
                          tone: "tag" as const,
                        })),
                      ]}
                      compact
                    />
                  )}
                  {!selected && statusLabel && (
                    <NetflixStatusBar label={statusLabel} />
                  )}
                  {!selected && !statusLabel && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/95 via-black/55 to-transparent px-3 pb-3 pt-12">
                      <p className="font-sans text-base font-semibold text-white sm:text-lg">
                        ${home.price.toLocaleString()}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-sm text-white/80 sm:text-[0.9rem]">
                        {home.modelName || community.name}
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
                      {home.modelName || `$${home.price.toLocaleString()}`}
                    </p>
                    <HomeListingCategoryBadges
                      categories={categories}
                      max={5}
                      size="md"
                      className="mt-2"
                    />
                    <p className="mt-2 text-xs text-[#bcbcbc] sm:text-sm">
                      {community.city}, NC
                      <span className="mx-1.5">•</span>
                      {home.bedrooms} bd
                      <span className="mx-1.5">•</span>
                      {home.bathrooms} ba
                      <span className="mx-1.5">•</span>
                      {home.sqft.toLocaleString()} sqft
                    </p>
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#d2d2d2] sm:text-sm">
                      {home.tagline ||
                        `${home.bedrooms} bed, ${home.bathrooms} bath home in ${community.name}.`}
                    </p>
                    {ppsf && (
                      <p className="mt-2 text-xs font-semibold text-white">
                        ${ppsf}/sqft
                      </p>
                    )}
                  </div>
                </div>
              </Link>

              {(selected || (coarse && previewUrl)) && (
                <div className="pointer-events-none absolute inset-x-0 top-0 z-20 aspect-video">
                  {selected && (
                    <div className="pointer-events-auto absolute left-2 top-2">
                      <TileActionBar
                        homeId={home.id}
                        homeCommunityId={community.id}
                      />
                    </div>
                  )}
                  {previewUrl && (
                    <>
                      {selected && (
                        <div className="pointer-events-auto absolute bottom-2 left-2 right-2">
                          <VideoQuickActions
                            youtubeUrl={previewUrl}
                            title={home.modelName || community.name}
                            onOpenPlayer={() =>
                              openModelPlayer(community.id, home.id)
                            }
                          />
                        </div>
                      )}
                      <Link
                        href={communityPlayHref(community.id, home.id)}
                        className={cn(
                          "pointer-events-auto flex items-center justify-center transition-opacity duration-300",
                          coarse
                            ? "absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 opacity-100"
                            : "absolute inset-0 opacity-0 hover:opacity-100 focus-visible:opacity-100",
                        )}
                        aria-label={`Play ${home.modelName || community.name} video`}
                      >
                        <span className="flex size-10 items-center justify-center rounded-full bg-white/90 text-black shadow-lg">
                          <Play className="size-4 fill-black" />
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
