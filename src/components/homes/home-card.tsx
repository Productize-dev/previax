import Link from "next/link";
import { Bed, Bath, Maximize } from "lucide-react";

import { BuyerActionButtons } from "@/components/buyer/buyer-action-buttons";

import { pricePerSqft } from "@/lib/community-utils";
import type { Home } from "@/lib/types";
import { cn } from "@/lib/utils";

type HomeCardProps = {
  home: Home;
  communityId: string;
  communityName?: string;
  city?: string;
  className?: string;
};

export function HomeCard({
  home,
  communityId,
  communityName,
  city,
  className,
}: HomeCardProps) {
  const cover = home.imageUrls[0];
  const photoCount = home.imageUrls.length;
  const ppsf = pricePerSqft(home);
  const status = home.status ?? "available";

  return (
    <div className={cn("listing-card group relative", className)}>
      <Link
        href={`/communities/${communityId}/homes/${home.id}`}
        className="block w-full text-left"
      >
      <div className="relative aspect-[16/10] overflow-hidden">
        {cover ? (
          <img
            src={cover}
            alt={`$${home.price.toLocaleString()} home`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">
            No image
          </div>
        )}
        {status !== "available" && (
          <span className="absolute top-3 left-3 rounded-sm bg-background/95 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide">
            {status.replace("-", " ")}
          </span>
        )}
        {photoCount > 1 && (
          <span className="absolute right-2 bottom-2 rounded-sm bg-black/75 px-2 py-0.5 text-xs text-white">
            {photoCount} photos
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="font-heading text-xl text-foreground md:text-2xl">
          ${home.price.toLocaleString()}
        </p>
        {ppsf && (
          <p className="text-xs text-muted-foreground">${ppsf}/sqft</p>
        )}
        {communityName && (
          <p className="mt-1 font-heading text-lg leading-snug">{communityName}</p>
        )}
        {city && (
          <p className="text-sm text-muted-foreground">{city}, NC</p>
        )}
        <div className="stat-pipes mt-2">
          <span className="flex items-center gap-1">
            <Bed className="size-3.5" />
            {home.bedrooms} bd
          </span>
          <span className="flex items-center gap-1">
            <Bath className="size-3.5" />
            {home.bathrooms} ba
          </span>
          <span className="flex items-center gap-1">
            <Maximize className="size-3.5" />
            {home.sqft.toLocaleString()} sqft
          </span>
        </div>
        {home.tagline && (
          <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">
            {home.tagline}
          </p>
        )}
      </div>
      </Link>
      <div className="absolute top-3 right-3 z-10">
        <BuyerActionButtons
          homeId={home.id}
          homeCommunityId={communityId}
        />
      </div>
    </div>
  );
}
