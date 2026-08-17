"use client";

import Link from "next/link";
import { memo } from "react";
import { Play } from "lucide-react";

import { YouTubePosterImage } from "@/components/communities/youtube-poster-image";
import { useNetflixRowSelection } from "@/components/home/use-netflix-row-selection";
import { usePrefersCoarsePointer } from "@/hooks/use-prefers-coarse-pointer";
import {
  getAvailableFloorPlanCount,
  getRentRange,
} from "@/lib/apartment-utils";
import type { ApartmentCommunity } from "@/lib/types";
import { cn } from "@/lib/utils";

type NetflixApartmentRowProps = {
  title: string;
  id?: string;
  communities: ApartmentCommunity[];
  className?: string;
};

export const NetflixApartmentRow = memo(function NetflixApartmentRow({
  title,
  id,
  communities,
  className,
}: NetflixApartmentRowProps) {
  const coarse = usePrefersCoarsePointer();
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
    defaultIndex: -1,
    enableHoverSelect: !coarse,
  });

  if (communities.length === 0) return null;

  return (
    <section id={id} className={cn("relative z-10 px-[4%] py-3", className)}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="font-heading text-xl text-white md:text-2xl">{title}</h2>
        <Link
          href="/rent"
          className="text-sm text-[#b3b3b3] transition-colors hover:text-white"
        >
          See all
        </Link>
      </div>
      <div
        ref={trackRef}
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
        onMouseLeave={handleTrackMouseLeave}
      >
        {communities.map((community, index) => {
          const rentRange = getRentRange(community);
          const planCount = getAvailableFloorPlanCount(community);
          const selected = selectedIndex === index;
          return (
            <div
              key={community.id}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              className={cn(
                "group relative w-[260px] shrink-0 snap-start sm:w-[280px]",
                selected && "z-10",
              )}
              onMouseEnter={() => selectOnHover(index)}
              onMouseLeave={handleTileMouseLeave}
              onFocus={() => selectIndex(index)}
            >
              <Link href={`/rent/${community.id}`} className="block text-left">
                <div className="relative aspect-video overflow-hidden rounded-sm bg-[#2a2a2a]">
                  {community.youtubeUrl || community.thumbnailUrl ? (
                    <YouTubePosterImage
                      videoUrl={community.youtubeUrl}
                      fallbackUrl={community.thumbnailUrl}
                      className="h-full w-full"
                      imgClassName="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <div
                    className={cn(
                      "absolute inset-0 flex items-center justify-center transition-opacity",
                      coarse
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100",
                    )}
                  >
                    <div className="flex size-11 items-center justify-center rounded-full bg-white text-black">
                      <Play className="size-4 fill-current" />
                    </div>
                  </div>
                  <span className="absolute top-2 left-2 rounded-sm bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                    Rent
                  </span>
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    {rentRange && (
                      <p className="font-heading text-base text-white">
                        {rentRange.label}
                      </p>
                    )}
                    <p className="mt-0.5 line-clamp-1 text-sm font-medium text-white">
                      {community.name}
                    </p>
                    <p className="text-xs text-white/70">
                      {community.city}, NC
                      {planCount > 0
                        ? ` · ${planCount} plan${planCount === 1 ? "" : "s"}`
                        : ""}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
});
