"use client";

import { useMemo } from "react";

import { LandingCarousel } from "@/components/landing/landing-carousel";
import {
  LandingCommunityTile,
  communityRibbon,
} from "@/components/landing/landing-community-tile";
import { FadeInSection } from "@/components/ui/fade-in-section";
import { useData } from "@/context/data-context";
import { getPublicCommunities } from "@/lib/community-utils";
import { resolveFeaturedCommunities } from "@/lib/homepage-featured-communities";

export function LandingTrendingCommunities() {
  const { communities, featuredCommunities } = useData();

  const { tiles, featuredIds } = useMemo(() => {
    const visible = getPublicCommunities(communities);
    const featured = resolveFeaturedCommunities(
      featuredCommunities,
      communities,
      visible,
    );
    const featuredIdSet = new Set(featured.map((c) => c.id));
    const rest = visible.filter((c) => !featuredIdSet.has(c.id));
    const ordered = [...featured, ...rest].slice(0, 12);
    return { tiles: ordered, featuredIds: featuredIdSet };
  }, [communities, featuredCommunities]);

  if (tiles.length === 0) return null;

  return (
    <FadeInSection>
      <section
        id="communities"
        className="scroll-mt-24 border-t border-white/10 bg-black py-16 md:py-20"
      >
        <div className="mb-8 px-[4%]">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
            Trending now
          </p>
          <h2 className="font-heading mt-2 text-3xl text-white sm:text-4xl">
            Communities
          </h2>
        </div>

        <LandingCarousel aria-label="Trending communities" scrollAmount={440}>
          {tiles.map((community) => (
            <LandingCommunityTile
              key={community.id}
              community={community}
              size="lg"
              ribbon={communityRibbon(community, {
                featured: featuredIds.has(community.id),
              })}
            />
          ))}
        </LandingCarousel>
      </section>
    </FadeInSection>
  );
}
