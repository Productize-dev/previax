"use client";

import Link from "next/link";
import { Play } from "lucide-react";

import {
  getAvailableFloorPlanCount,
  getRentRange,
} from "@/lib/apartment-utils";
import { usePrefersCoarsePointer } from "@/hooks/use-prefers-coarse-pointer";
import type { ApartmentCommunity } from "@/lib/types";
import { cn } from "@/lib/utils";

type ApartmentCardProps = {
  community: ApartmentCommunity;
  className?: string;
  variant?: "grid" | "row";
};

export function ApartmentCard({
  community,
  className,
  variant = "grid",
}: ApartmentCardProps) {
  const coarse = usePrefersCoarsePointer();
  const rentRange = getRentRange(community);
  const planCount = getAvailableFloorPlanCount(community);
  const href = `/rent/${community.id}`;

  if (variant === "row") {
    return (
      <div
        className={cn(
          "listing-card group relative w-[280px] shrink-0 snap-start sm:w-[300px]",
          className,
        )}
      >
        <Link href={href} className="block">
          <div className="relative aspect-video overflow-hidden">
            {community.thumbnailUrl ? (
              <img
                src={community.thumbnailUrl}
                alt={community.name}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="h-full w-full bg-muted" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center transition-opacity",
                coarse ? "opacity-100" : "opacity-0 group-hover:opacity-100",
              )}
            >
              <div className="flex size-12 items-center justify-center rounded-full bg-foreground text-background">
                <Play className="size-5 fill-current" />
              </div>
            </div>
            <span className="absolute top-3 left-3 rounded-sm bg-primary px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground">
              Rent
            </span>
            <div className="absolute inset-x-0 bottom-0 p-4">
              {rentRange && (
                <p className="font-heading text-xl text-foreground">
                  {rentRange.label}
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
      </div>
    );
  }

  return (
    <div className={cn("listing-card group relative", className)}>
      <Link href={href} className="block">
        <div className="relative aspect-[16/10] overflow-hidden">
          {community.thumbnailUrl ? (
            <img
              src={community.thumbnailUrl}
              alt={community.name}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-muted" />
          )}
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity",
              coarse ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            )}
          >
            <div className="flex size-12 items-center justify-center rounded-full bg-foreground text-background">
              <Play className="size-5 fill-current" />
            </div>
          </div>
          <span className="absolute top-3 left-3 rounded-sm bg-primary px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground">
            Rent
          </span>
        </div>
        <div className="p-4">
          {rentRange && (
            <p className="font-heading text-xl text-foreground md:text-2xl">
              {rentRange.label}
            </p>
          )}
          <h3 className="font-heading mt-1 text-lg leading-snug">
            {community.name}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {community.city}, NC
          </p>
          <div className="stat-pipes mt-2">
            {planCount > 0 && (
              <span>
                {planCount} floor plan{planCount !== 1 ? "s" : ""}
              </span>
            )}
            <span>For relocators</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
