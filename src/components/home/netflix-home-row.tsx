"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useCallback } from "react";
import { Play } from "lucide-react";

import { HomeListingCategoryBadges } from "@/components/homes/home-listing-category-badges";
import { TileActionBar } from "@/components/home/tile-action-bar";
import { NetflixHoverPreview } from "@/components/home/netflix-hover-preview";
import { VideoQuickActions } from "@/components/video/video-quick-actions";
import type { HomeRowItem } from "@/lib/homepage-sections";
import { pricePerSqft } from "@/lib/community-utils";
import { getHomeListingCategories } from "@/lib/home-listing-categories";
import { cn } from "@/lib/utils";

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

  const openModelPage = useCallback(
    (communityId: string, homeId: string) => {
      router.push(
        `/communities/${communityId}?models=1&model=${encodeURIComponent(homeId)}`,
      );
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
          const cover = home.imageUrls[0] ?? community.thumbnailUrl;
          const ppsf = pricePerSqft(home);
          const categories = getHomeListingCategories(home, community);
          const previewUrl = home.youtubeUrl || community.youtubeUrl;

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
              onFocus={() => selectIndex(index, { immediate: true })}
            >
              <Link
                href={`/communities/${community.id}/homes/${home.id}`}
                onClick={(e) => {
                  if (!selected) {
                    e.preventDefault();
                    selectIndex(index, { immediate: true });
                  }
                }}
                className="netflix-tile-link block w-full outline-none"
                aria-label={`${community.name} — $${home.price.toLocaleString()}`}
              >
                <div
                  className={cn(
                    "netflix-tile-media overflow-hidden rounded-[4px] border-2 bg-[#2f2f2f]",
                    selected
                      ? "netflix-tile-media--landscape border-white"
                      : "netflix-tile-media--portrait border-transparent",
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
                  {categories.length > 0 && (
                    <div className="pointer-events-none absolute left-1.5 right-1.5 top-1.5 z-10">
                      <HomeListingCategoryBadges
                        categories={categories}
                        max={selected ? 4 : 2}
                      />
                    </div>
                  )}
                  {!selected && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-2 pb-2 pt-8">
                      <p className="text-xs font-semibold text-white sm:text-sm">
                        ${home.price.toLocaleString()}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-white/80 sm:text-xs">
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
                    <HomeListingCategoryBadges
                      categories={categories}
                      max={5}
                      size="md"
                      className="mt-3"
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

              {selected && (
                <div className="pointer-events-none absolute inset-x-0 top-0 z-20 aspect-video">
                  <div className="pointer-events-auto absolute left-2 top-2">
                    <TileActionBar
                      homeId={home.id}
                      homeCommunityId={community.id}
                    />
                  </div>
                  {previewUrl && (
                    <>
                      <div className="pointer-events-auto absolute bottom-2 left-2 right-2">
                        <VideoQuickActions
                          youtubeUrl={previewUrl}
                          title={home.modelName || community.name}
                          onOpenPlayer={() =>
                            openModelPage(community.id, home.id)
                          }
                        />
                      </div>
                      <Link
                        href={`/communities/${community.id}?models=1&model=${encodeURIComponent(home.id)}`}
                        className="pointer-events-auto absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 hover:opacity-100 focus-visible:opacity-100"
                        aria-label={`Open ${home.modelName || community.name} on community page`}
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
