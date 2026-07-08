"use client";

import Link from "next/link";

import type { HomeRowItem } from "@/lib/homepage-sections";
import { pricePerSqft } from "@/lib/community-utils";
import { getHomeListingCategories } from "@/lib/home-listing-categories";
import type { Community, Home } from "@/lib/types";
import { cn } from "@/lib/utils";

import { HomeListingCategoryBadges } from "@/components/homes/home-listing-category-badges";
import { useNetflixRowSelection } from "./use-netflix-row-selection";

export type { HomeRowItem };

type NetflixHomeRowProps = {
  title: string;
  id?: string;
  items: HomeRowItem[];
  defaultIndex?: number;
  onSelect?: (item: HomeRowItem) => void;
  className?: string;
};

export function NetflixHomeRow({
  title,
  id,
  items,
  defaultIndex = 0,
  onSelect,
  className,
}: NetflixHomeRowProps) {
  const { selectedIndex, selectIndex, selectOnHover, trackRef, itemRefs } =
    useNetflixRowSelection({
      items,
      defaultIndex,
      onSelect,
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
      >
        {items.map(({ home, community }, index) => {
          const selected = index === selectedIndex;
          const cover = home.imageUrls[0];
          const ppsf = pricePerSqft(home);
          const categories = getHomeListingCategories(home, community);

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
                  {cover ? (
                    <img
                      src={cover}
                      alt={`$${home.price.toLocaleString()} home`}
                      className="h-full w-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-[#808080]">
                      No image
                    </div>
                  )}
                  {categories.length > 0 && (
                    <div className="pointer-events-none absolute top-1.5 left-1.5 right-1.5">
                      <HomeListingCategoryBadges
                        categories={categories}
                        max={selected ? 4 : 2}
                      />
                    </div>
                  )}
                  {!selected && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-2 pb-2 pt-8">
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
            </div>
          );
        })}
      </div>
    </section>
  );
}
