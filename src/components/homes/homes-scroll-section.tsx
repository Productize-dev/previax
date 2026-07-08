"use client";

import { useMemo, useRef, useState } from "react";

import { HomeCard } from "@/components/homes/home-card";
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
import type { HomeListing } from "@/lib/community-utils";
import { filterHomeListings } from "@/lib/community-utils";
import { cn } from "@/lib/utils";

type HomesScrollSectionProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  listings: HomeListing[];
  showFilters?: boolean;
  showCommunityMeta?: boolean;
  bleed?: boolean;
  headerSize?: "default" | "compact";
  hideSubtitle?: boolean;
  searchQuery?: string;
  cityFilter?: string;
  className?: string;
};

export function HomesScrollSection({
  id,
  eyebrow,
  title,
  subtitle,
  listings,
  showFilters = true,
  showCommunityMeta = true,
  bleed = false,
  headerSize = "default",
  hideSubtitle = false,
  searchQuery = "",
  cityFilter = "all",
  className,
}: HomesScrollSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sort, setSort] = useState<"price-asc" | "price-desc" | "beds-desc">(
    "price-asc",
  );
  const [beds, setBeds] = useState("all");

  const filtered = useMemo(
    () =>
      filterHomeListings(listings, {
        query: searchQuery,
        city: cityFilter,
        beds: beds === "all" ? null : Number(beds),
        sort,
      }),
    [listings, searchQuery, cityFilter, beds, sort],
  );

  function scrollBy(direction: "left" | "right") {
    scrollRef.current?.scrollBy({
      left: direction === "left" ? -340 : 340,
      behavior: "smooth",
    });
  }

  if (listings.length === 0) return null;

  return (
    <section id={id} className={className}>
      <SectionHeader
        eyebrow={eyebrow}
        title={title}
        size={headerSize}
        subtitle={
          hideSubtitle
            ? undefined
            : (subtitle ??
              `${filtered.length} home${filtered.length !== 1 ? "s" : ""} available`)
        }
        onScrollLeft={
          filtered.length > 0 ? () => scrollBy("left") : undefined
        }
        onScrollRight={
          filtered.length > 0 ? () => scrollBy("right") : undefined
        }
      />

      {showFilters && (
        <div className="mb-8 flex flex-wrap items-center gap-3 rounded-xl glass-panel p-4">
          <Select
            value={sort}
            onValueChange={(v) =>
              setSort((v ?? "price-asc") as typeof sort)
            }
          >
            <SelectTrigger className="w-44 rounded-full bg-background/80">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="beds-desc">Most bedrooms</SelectItem>
            </SelectContent>
          </Select>
          <Select value={beds} onValueChange={(v) => setBeds(v ?? "all")}>
            <SelectTrigger className="w-36 rounded-full bg-background/80">
              <SelectValue placeholder="Bedrooms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All beds</SelectItem>
              <SelectItem value="3">3+ beds</SelectItem>
              <SelectItem value="4">4+ beds</SelectItem>
              <SelectItem value="5">5+ beds</SelectItem>
            </SelectContent>
          </Select>
          {searchQuery && (
            <p className="ml-auto text-sm text-muted-foreground">
              Showing results for &ldquo;{searchQuery}&rdquo;
            </p>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-muted-foreground">
          No homes match your filters. Try adjusting your selection.
        </p>
      ) : (
        <ScrollRow
          ref={scrollRef}
          className={cn(
            "pb-2",
            bleed
              ? "-mx-6 px-6 md:-mx-[calc((100vw-80rem)/2+1.5rem)] md:px-[calc((100vw-80rem)/2+1.5rem)]"
              : "-mx-6 px-6",
          )}
        >
          {filtered.map(({ home, communityId, communityName, city }) => (
            <HomeCard
              key={`${communityId}-${home.id}`}
              home={home}
              communityId={communityId}
              communityName={showCommunityMeta ? communityName : undefined}
              city={showCommunityMeta ? city : undefined}
              className="w-[min(85vw,320px)] shrink-0 snap-start sm:w-[340px]"
            />
          ))}
        </ScrollRow>
      )}
    </section>
  );
}
