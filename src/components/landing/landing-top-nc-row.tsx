"use client";

import { useMemo } from "react";

import { LandingCarousel } from "@/components/landing/landing-carousel";
import { LandingCommunityTile } from "@/components/landing/landing-community-tile";
import { FadeInSection } from "@/components/ui/fade-in-section";
import { useData } from "@/context/data-context";
import { getPublicCommunities } from "@/lib/community-utils";
import { sortTop10Slots } from "@/lib/top-10-communities";
import type { Community } from "@/lib/types";

export function LandingTopNcRow() {
  const { communities, top10Communities } = useData();

  const ranked = useMemo(() => {
    const byId = new Map(
      getPublicCommunities(communities).map((c) => [c.id, c]),
    );
    const items: { community: Community; rank: number }[] = [];
    for (const slot of sortTop10Slots(top10Communities)) {
      const community = byId.get(slot.communityId);
      if (community) items.push({ community, rank: slot.rank });
    }
    return items;
  }, [communities, top10Communities]);

  if (ranked.length === 0) return null;

  return (
    <FadeInSection>
      <section className="border-t border-white/10 bg-[#0a0a0a] py-16 md:py-20">
        <div className="mb-8 px-[4%]">
          <h2 className="font-heading text-3xl text-white sm:text-4xl">
            Top Communities In North Carolina
          </h2>
        </div>

        <LandingCarousel
          aria-label="Top communities in North Carolina"
          scrollAmount={460}
        >
          {ranked.map(({ community, rank }) => (
            <LandingCommunityTile
              key={community.id}
              community={community}
              size="lg"
              rank={rank}
            />
          ))}
        </LandingCarousel>
      </section>
    </FadeInSection>
  );
}
