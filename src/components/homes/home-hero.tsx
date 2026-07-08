"use client";

import { Bed, Bath, Maximize } from "lucide-react";

import { pricePerSqft } from "@/lib/community-utils";
import type { Community, Home } from "@/lib/types";

type HomeHeroProps = {
  home: Home;
  community: Community;
};

export function HomeHero({ home, community }: HomeHeroProps) {
  const cover = home.imageUrls[0];
  const ppsf = pricePerSqft(home);
  const status = home.status ?? "available";

  return (
    <div className="relative mt-4 min-h-[55vh] overflow-hidden md:min-h-[65vh]">
      {cover ? (
        <img
          src={cover}
          alt=""
          className="absolute inset-0 h-full w-full object-cover scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-muted" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-black/40" />
      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-6 pb-10 pt-32 md:pb-14">
        <p className="section-eyebrow">
          {community.name} · {community.city}, NC
        </p>
        <h1 className="font-heading mt-3 text-4xl text-foreground md:text-5xl lg:text-6xl">
          ${home.price.toLocaleString()}
        </h1>
        {home.tagline && (
          <p className="mt-3 max-w-2xl text-lg text-foreground/90 md:text-xl">
            {home.tagline}
          </p>
        )}
        <div className="stat-pipes mt-4 text-foreground/80">
          <span className="flex items-center gap-1">
            <Bed className="size-4" />
            {home.bedrooms} bd
          </span>
          <span className="flex items-center gap-1">
            <Bath className="size-4" />
            {home.bathrooms} ba
          </span>
          <span className="flex items-center gap-1">
            <Maximize className="size-4" />
            {home.sqft.toLocaleString()} sqft
          </span>
          {ppsf && <span>${ppsf}/sqft</span>}
          {status !== "available" && (
            <span className="capitalize">{status.replace("-", " ")}</span>
          )}
        </div>
      </div>
    </div>
  );
}
