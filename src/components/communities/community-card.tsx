import Link from "next/link";
import { Play } from "lucide-react";

import { SaveButton } from "@/components/buyer/save-button";
import {
  getAvailableHomeCount,
  getFirstOfferTeaser,
  getPriceRange,
  hasActiveOffers,
} from "@/lib/community-utils";
import type { Community } from "@/lib/types";
import { cn } from "@/lib/utils";

type CommunityCardProps = {
  community: Community;
  className?: string;
  variant?: "grid" | "row";
};

export function CommunityCard({
  community,
  className,
  variant = "grid",
}: CommunityCardProps) {
  const priceRange = getPriceRange(community);
  const homeCount = getAvailableHomeCount(community);
  const offerTeaser = getFirstOfferTeaser(community);

  if (variant === "row") {
    return (
      <div
        className={cn(
          "listing-card group relative w-[280px] shrink-0 snap-start sm:w-[300px]",
          className,
        )}
      >
        <Link href={`/communities/${community.id}`} className="block">
          <div className="relative aspect-[2/3] overflow-hidden">
            <img
              src={community.thumbnailUrl}
              alt={community.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
              <div className="flex size-12 items-center justify-center rounded-full bg-foreground text-background">
                <Play className="size-5 fill-current" />
              </div>
            </div>
            {hasActiveOffers(community) && (
              <span className="absolute top-3 left-3 rounded-sm bg-primary px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground">
                Offers
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 p-4">
              {priceRange && (
                <p className="font-heading text-xl text-foreground">
                  {priceRange.label}
                </p>
              )}
              <h3 className="font-heading mt-1 text-lg leading-snug text-foreground">
                {community.name}
              </h3>
              <p className="mt-0.5 text-sm text-foreground/70">
                {community.city}, NC
              </p>
            </div>
          </div>
        </Link>
        <div className="absolute top-3 right-3 z-10">
          <SaveButton communityId={community.id} />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("listing-card group relative", className)}>
      <Link href={`/communities/${community.id}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={community.thumbnailUrl}
            alt={community.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="flex size-12 items-center justify-center rounded-full bg-foreground text-background">
              <Play className="size-5 fill-current" />
            </div>
          </div>
          {hasActiveOffers(community) && (
            <span className="absolute top-3 left-3 rounded-sm bg-primary px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground">
              Offers
            </span>
          )}
        </div>
        <div className="p-4">
          {priceRange && (
            <p className="font-heading text-xl text-foreground md:text-2xl">
              {priceRange.label}
            </p>
          )}
          <h3 className="font-heading mt-1 text-lg leading-snug">
            {community.name}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {community.city}, NC
          </p>
          <div className="stat-pipes mt-2">
            {homeCount > 0 && (
              <span>
                {homeCount} home{homeCount !== 1 ? "s" : ""}
              </span>
            )}
            <span>{community.builderName}</span>
            {hasActiveOffers(community) && (
              <span className="text-primary">Builder offers</span>
            )}
          </div>
          {offerTeaser && (
            <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">
              {offerTeaser}
            </p>
          )}
        </div>
      </Link>
      <div className="absolute top-3 right-3 z-10">
        <SaveButton communityId={community.id} />
      </div>
    </div>
  );
}
