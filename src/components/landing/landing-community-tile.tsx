"use client";

import Image from "next/image";
import Link from "next/link";

import { getCommunityHeroPosterUrl } from "@/lib/community-media";
import { hasActiveOffers } from "@/lib/community-utils";
import type { Community } from "@/lib/types";
import { cn } from "@/lib/utils";

export type LandingCommunityRibbon =
  | { tone: "featured"; label: string }
  | { tone: "exclusive"; label: string }
  | { tone: "new"; label: string }
  | { tone: "soon"; label: string }
  | { tone: "offers"; label: string }
  | { tone: "top"; label: string };

const RIBBON_CLASS: Record<LandingCommunityRibbon["tone"], string> = {
  featured: "bg-primary text-primary-foreground",
  exclusive: "bg-[#7a1f2b] text-white",
  new: "bg-white text-black",
  soon: "bg-amber-400 text-black",
  offers: "bg-[#46d369] text-black",
  top: "bg-[#e50914] text-white",
};

type LandingCommunityTileProps = {
  community: Community;
  href?: string;
  ribbon?: LandingCommunityRibbon | null;
  rank?: number | null;
  className?: string;
  /** Wider tile for top-10 style rows. */
  size?: "md" | "lg";
};

export function LandingCommunityTile({
  community,
  href = `/communities/${community.id}`,
  ribbon,
  rank,
  className,
  size = "md",
}: LandingCommunityTileProps) {
  const poster = getCommunityHeroPosterUrl(community);
  const tagline =
    community.tagline ||
    community.mainHighlight ||
    (hasActiveOffers(community) ? "Builder offers available" : null);

  return (
    <div
      role="listitem"
      className={cn(
        "relative shrink-0 snap-start",
        size === "lg"
          ? "w-[min(85vw,340px)] sm:w-[min(46vw,380px)] md:w-[min(34vw,420px)]"
          : "w-[min(85vw,300px)] sm:w-[min(42vw,360px)] md:w-[min(32vw,400px)]",
        rank != null && "pl-7 sm:pl-9",
        className,
      )}
    >
      {rank != null && (
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 z-[5] select-none font-sans text-[5.5rem] font-black leading-none tracking-tighter sm:text-[7rem] md:text-[8rem]"
          style={{
            WebkitTextStroke: "3px #b3b3b3",
            color: "#000",
            transform: "translate(-18%, 8%)",
          }}
        >
          {rank}
        </span>
      )}

      <Link
        href={href}
        className="group relative block overflow-hidden rounded-sm ring-1 ring-white/10 transition duration-300 hover:ring-white/35"
      >
        <div className="relative aspect-video bg-[#1a1a1a]">
          {poster ? (
            <Image
              src={poster}
              alt=""
              fill
              sizes="(max-width: 768px) 85vw, 36vw"
              className="object-cover transition duration-500 group-hover:scale-[1.04]"
              unoptimized={poster.startsWith("http")}
            />
          ) : (
            <div className="flex size-full items-center justify-center text-sm text-white/40">
              No image
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent opacity-60" />

          {ribbon && (
            <span
              className={cn(
                "absolute left-2 top-2 z-10 rounded-[2px] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:text-[11px]",
                RIBBON_CLASS[ribbon.tone],
              )}
            >
              {ribbon.label}
            </span>
          )}

          <div className="absolute inset-x-0 bottom-0 z-10 p-3 sm:p-3.5">
            <p className="font-heading text-lg font-semibold leading-tight text-white sm:text-xl">
              {community.name}
            </p>
            <p className="mt-1 truncate text-xs text-white/70 sm:text-sm">
              {community.city}, NC
              {tagline ? ` · ${tagline}` : ""}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}

export function communityRibbon(
  community: Community,
  opts?: { featured?: boolean; topRank?: number | null },
): LandingCommunityRibbon | null {
  if (opts?.topRank != null) {
    return { tone: "top", label: `Top ${opts.topRank}` };
  }
  if (opts?.featured) {
    return { tone: "featured", label: "Featured" };
  }
  if (hasActiveOffers(community)) {
    return { tone: "offers", label: "Offers" };
  }
  const ageDays =
    (Date.now() - community.createdAt) / (1000 * 60 * 60 * 24);
  if (ageDays <= 45) {
    return { tone: "new", label: "New" };
  }
  return null;
}
