"use client";

import { useRef } from "react";

import { CommunityCard } from "@/components/communities/community-card";
import {
  ScrollRow,
  SectionHeader,
} from "@/components/ui/section-header";
import { useBuyer } from "@/context/buyer-context";
import { useData } from "@/context/data-context";
import { filterCommunities } from "@/lib/community-utils";

export function TrendingRow() {
  const { communities, isLoaded } = useData();
  const { searchQuery, cityFilter, offersOnly } = useBuyer();
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!isLoaded) return null;

  const filtered = filterCommunities(communities, {
    query: searchQuery,
    city: cityFilter,
    offersOnly,
  });

  const trending = [...filtered]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 8);

  if (trending.length === 0) return null;

  function scrollBy(direction: "left" | "right") {
    scrollRef.current?.scrollBy({
      left: direction === "left" ? -320 : 320,
      behavior: "smooth",
    });
  }

  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Browse"
          title="Trending communities"
          subtitle="Popular destinations buyers are exploring right now"
          onScrollLeft={() => scrollBy("left")}
          onScrollRight={() => scrollBy("right")}
        />
        <ScrollRow ref={scrollRef}>
          {trending.map((community) => (
            <CommunityCard
              key={community.id}
              community={community}
              variant="row"
            />
          ))}
        </ScrollRow>
      </div>
    </section>
  );
}
