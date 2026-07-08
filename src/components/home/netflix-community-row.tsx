"use client";

import Link from "next/link";

import {
  getAvailableHomeCount,
  getPriceRange,
  hasActiveOffers,
} from "@/lib/community-utils";
import type { Community } from "@/lib/types";
import { cn } from "@/lib/utils";

import { useNetflixRowSelection } from "./use-netflix-row-selection";

type NetflixCommunityRowProps = {
  title: string;
  id?: string;
  communities: Community[];
  defaultIndex?: number;
  onSelect?: (community: Community) => void;
  className?: string;
};

export function NetflixCommunityRow({
  title,
  id,
  communities,
  defaultIndex = 0,
  onSelect,
  className,
}: NetflixCommunityRowProps) {
  const { selectedIndex, selectIndex, selectOnHover, trackRef, itemRefs } =
    useNetflixRowSelection({
      items: communities,
      defaultIndex,
      onSelect,
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
        aria-activedescendant={`${id ?? title}-item-${selectedIndex}`}
      >
        {communities.map((community, index) => {
          const selected = index === selectedIndex;
          const priceRange = getPriceRange(community);
          const homeCount = getAvailableHomeCount(community);
          const offers = hasActiveOffers(community);
          const year = new Date(community.createdAt).getFullYear();

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
              )}
              onMouseEnter={() => selectOnHover(index)}
              onFocus={() => selectIndex(index, { immediate: true })}
            >
              <Link
                href={`/communities/${community.id}`}
                onClick={(e) => {
                  if (!selected) {
                    e.preventDefault();
                    selectIndex(index, { immediate: true });
                  }
                }}
                className="netflix-tile-link block w-full outline-none"
                aria-label={community.name}
              >
                <div
                  className={cn(
                    "netflix-tile-media overflow-hidden rounded-[4px] border-2 bg-[#2f2f2f]",
                    selected
                      ? "netflix-tile-media--landscape border-white"
                      : "netflix-tile-media--portrait border-transparent",
                  )}
                >
                  <img
                    src={community.thumbnailUrl}
                    alt={community.name}
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                  {!selected && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-2 pb-2 pt-8">
                      <p className="line-clamp-2 text-xs font-semibold leading-tight text-white sm:text-sm">
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
                    <p className="mt-3 text-xs text-[#bcbcbc] sm:text-sm">
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
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#d2d2d2] sm:text-sm sm:line-clamp-3">
                      {community.description ||
                        community.tagline ||
                        `${community.builderName} community in ${community.city}.`}
                    </p>
                    {priceRange && (
                      <p className="mt-2 text-xs font-semibold text-white">
                        {priceRange.label}
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
