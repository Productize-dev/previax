"use client";

import { useRef } from "react";

import { CommunityCard } from "@/components/communities/community-card";
import { FadeInSection } from "@/components/ui/fade-in-section";
import {
  ScrollRow,
  SectionHeader,
} from "@/components/ui/section-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBuyer } from "@/context/buyer-context";
import { useData } from "@/context/data-context";
import {
  filterCommunities,
  getUniqueCities,
} from "@/lib/community-utils";

export function CommunityGrid() {
  const { communities, isLoaded } = useData();
  const { searchQuery, cityFilter, setCityFilter, offersOnly, setOffersOnly } =
    useBuyer();
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = filterCommunities(communities, {
    query: searchQuery,
    city: cityFilter,
    offersOnly,
  });
  const cities = getUniqueCities(communities);

  function scrollBy(direction: "left" | "right") {
    scrollRef.current?.scrollBy({
      left: direction === "left" ? -340 : 340,
      behavior: "smooth",
    });
  }

  return (
    <FadeInSection>
      <section id="communities" className="border-t border-border/50 py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader
            eyebrow="Explore"
            title="All communities in North Carolina"
            subtitle={
              isLoaded
                ? `${filtered.length} communit${filtered.length === 1 ? "y" : "ies"} available`
                : undefined
            }
            onScrollLeft={
              filtered.length > 0 ? () => scrollBy("left") : undefined
            }
            onScrollRight={
              filtered.length > 0 ? () => scrollBy("right") : undefined
            }
          />

          <div className="mb-8 flex flex-wrap items-center gap-3 rounded-xl glass-panel p-4">
            <Select
              value={cityFilter}
              onValueChange={(v) => setCityFilter(v ?? "all")}
            >
              <SelectTrigger className="w-44 rounded-full bg-background/80">
                <SelectValue placeholder="All cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cities</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label className="flex cursor-pointer items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-2 text-sm">
              <input
                type="checkbox"
                checked={offersOnly}
                onChange={(e) => setOffersOnly(e.target.checked)}
                className="accent-primary"
              />
              Has builder offers
            </label>
            {searchQuery && (
              <p className="ml-auto text-sm text-muted-foreground">
                Showing results for &ldquo;{searchQuery}&rdquo;
              </p>
            )}
          </div>

          {!isLoaded ? (
            <p className="text-muted-foreground">Loading communities...</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground">
              No communities match your search. Try adjusting filters.
            </p>
          ) : (
            <ScrollRow ref={scrollRef} className="-mx-6 px-6 pb-2">
              {filtered.map((community) => (
                <CommunityCard
                  key={community.id}
                  community={community}
                  className="w-[min(85vw,320px)] shrink-0 snap-start sm:w-[340px]"
                />
              ))}
            </ScrollRow>
          )}
        </div>
      </section>
    </FadeInSection>
  );
}
