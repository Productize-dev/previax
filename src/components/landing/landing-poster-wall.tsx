"use client";

import Image from "next/image";
import { useMemo } from "react";

import { useData } from "@/context/data-context";
import { getPublicCommunities } from "@/lib/community-utils";
import { cn } from "@/lib/utils";

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=80",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&q=80",
  "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=600&q=80",
];

type LandingPosterWallProps = {
  className?: string;
};

export function LandingPosterWall({ className }: LandingPosterWallProps) {
  const { communities } = useData();

  const posters = useMemo(() => {
    const fromCatalog = getPublicCommunities(communities)
      .map((c) => c.thumbnailUrl)
      .filter(Boolean);
    const pool =
      fromCatalog.length >= 6
        ? fromCatalog
        : [...fromCatalog, ...FALLBACK_IMAGES];
    return Array.from({ length: 18 }, (_, i) => pool[i % pool.length]);
  }, [communities]);

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      <div className="absolute inset-0 origin-center scale-110 rotate-[-8deg]">
        <div className="landing-poster-grid grid grid-cols-3 gap-3 p-4 sm:grid-cols-4 md:grid-cols-5 md:gap-4 lg:grid-cols-6">
          {posters.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="landing-poster-tile relative aspect-[2/3] overflow-hidden rounded-sm opacity-0"
              style={{ animationDelay: `${(i % 9) * 60}ms` }}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="(max-width: 768px) 33vw, 16vw"
                className="object-cover"
                unoptimized={src.startsWith("http")}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/75 to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.85)_70%)]" />
    </div>
  );
}
