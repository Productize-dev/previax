"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { NetflixCommunityRow } from "@/components/home/netflix-community-row";
import { NetflixHero } from "@/components/home/netflix-hero";
import { NetflixHomeRow } from "@/components/home/netflix-home-row";
import { NetflixLendersRow } from "@/components/home/netflix-lenders-row";
import { NetflixNavbar } from "@/components/home/netflix-navbar";
import { NetflixSearchSkeleton } from "@/components/home/netflix-search-skeleton";
import { useBuyer } from "@/context/buyer-context";
import { useData } from "@/context/data-context";
import { useAiSearch } from "@/hooks/use-ai-search";
import { applyAiFilters } from "@/lib/ai";
import { filterCommunities } from "@/lib/community-utils";
import { resolveFeaturedCommunities } from "@/lib/homepage-featured-communities";
import {
  buildCitySections,
  buildCommunityTagSections,
  buildHomeTagSections,
  buildListingCategorySections,
  buildMainHighlightSections,
} from "@/lib/homepage-sections";
import type { Community } from "@/lib/types";

function resolveFilteredCommunities(
  communities: Community[],
  opts: {
    searchQuery: string;
    cityFilter: string;
    offersOnly: boolean;
    aiCommunityIds: string[] | null;
    aiFilters: ReturnType<typeof useBuyer>["aiFilters"];
  },
): Community[] {
  const { searchQuery, cityFilter, offersOnly, aiCommunityIds, aiFilters } =
    opts;

  if (aiCommunityIds !== null) {
    if (aiCommunityIds.length === 0) return [];
    return aiCommunityIds
      .map((id) => communities.find((c) => c.id === id))
      .filter((c): c is Community => Boolean(c));
  }

  if (aiFilters) {
    return applyAiFilters(communities, aiFilters);
  }

  return filterCommunities(communities, {
    query: searchQuery,
    city: cityFilter,
    offersOnly,
  });
}

export function NetflixHomepage() {
  const { communities, featuredCommunities, customCommunityTagLabels, isLoaded } =
    useData();
  const {
    searchQuery,
    cityFilter,
    offersOnly,
    savedIds,
    aiCommunityIds,
    aiFilters,
    aiSearchLoading,
    personalizedRows,
  } = useBuyer();
  const { loadRecommendations } = useAiSearch(communities);
  const [focusCommunity, setFocusCommunity] = useState<Community | null>(null);

  useEffect(() => {
    if (isLoaded && communities.length > 0) {
      void loadRecommendations();
    }
  }, [isLoaded, communities.length, loadRecommendations]);

  const handleTrendingSelect = useCallback((community: Community) => {
    setFocusCommunity(community);
  }, []);

  const filtered = useMemo(
    () =>
      resolveFilteredCommunities(communities, {
        searchQuery,
        cityFilter,
        offersOnly,
        aiCommunityIds,
        aiFilters,
      }),
    [communities, searchQuery, cityFilter, offersOnly, aiCommunityIds, aiFilters],
  );

  const communityById = useMemo(
    () => new Map(communities.map((c) => [c.id, c])),
    [communities],
  );

  const trending = useMemo(
    () => [...filtered].sort((a, b) => b.createdAt - a.createdAt).slice(0, 10),
    [filtered],
  );

  const featuredCommunityRow = useMemo(
    () =>
      resolveFeaturedCommunities(featuredCommunities, communities, filtered),
    [featuredCommunities, communities, filtered],
  );

  const saved = useMemo(
    () =>
      savedIds
        .map((id) => communities.find((c) => c.id === id))
        .filter((c): c is NonNullable<typeof c> => Boolean(c)),
    [communities, savedIds],
  );

  const listingCategorySections = useMemo(
    () => buildListingCategorySections(filtered),
    [filtered],
  );

  const mainHighlightSections = useMemo(
    () => buildMainHighlightSections(filtered),
    [filtered],
  );

  const communityTagSections = useMemo(
    () => buildCommunityTagSections(filtered, customCommunityTagLabels),
    [filtered, customCommunityTagLabels],
  );

  const homeTagSections = useMemo(
    () => buildHomeTagSections(filtered),
    [filtered],
  );

  const citySections = useMemo(
    () => buildCitySections(filtered),
    [filtered],
  );

  const hasTagSections =
    communityTagSections.length > 0 || homeTagSections.length > 0;

  const showSkeleton = !isLoaded || aiSearchLoading;

  const hasActiveSearch =
    Boolean(searchQuery.trim()) ||
    aiCommunityIds !== null ||
    aiFilters !== null;

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <NetflixNavbar />

      {!hasActiveSearch && <NetflixHero focusCommunity={focusCommunity} />}

      <main
        className={
          hasActiveSearch
            ? "relative z-10 space-y-1 pb-20 pt-20 md:space-y-2"
            : "relative z-10 -mt-12 space-y-1 pb-20 sm:-mt-16 md:-mt-20 md:space-y-2"
        }
      >
        {showSkeleton ? (
          <NetflixSearchSkeleton rows={hasActiveSearch ? 2 : 3} />
        ) : filtered.length === 0 ? (
          <p className="px-[4%] py-8 text-[#808080]">
            No communities match your search.
          </p>
        ) : (
          <>
            {hasActiveSearch && aiCommunityIds !== null && (
              <p className="px-[4%] pb-2 text-sm text-[#b3b3b3]">
                {filtered.length} result{filtered.length === 1 ? "" : "s"} for
                &quot;{searchQuery}&quot;
              </p>
            )}

            {!hasActiveSearch &&
              personalizedRows.map((row) => {
                const rowCommunities = (row.communityIds ?? [])
                  .map((id) => communityById.get(id))
                  .filter((c): c is Community => Boolean(c));
                if (rowCommunities.length === 0) return null;
                return (
                  <NetflixCommunityRow
                    key={row.id}
                    title={row.title}
                    communities={rowCommunities}
                    onSelect={handleTrendingSelect}
                  />
                );
              })}

            {saved.length > 0 && (
              <NetflixCommunityRow title="My List" communities={saved} />
            )}

            <NetflixCommunityRow
              title={hasActiveSearch ? "Search results" : "Trending Now"}
              communities={hasActiveSearch ? filtered : trending}
              onSelect={handleTrendingSelect}
            />

            {!hasActiveSearch && featuredCommunityRow.length > 0 && (
              <NetflixCommunityRow
                title="Featured Communities"
                id="communities"
                communities={featuredCommunityRow}
              />
            )}

            {!hasActiveSearch &&
              listingCategorySections.map((section, index) => (
                <NetflixHomeRow
                  key={section.id}
                  id={index === 0 ? "houses" : section.id}
                  title={section.title}
                  items={section.items}
                />
              ))}

            {!hasActiveSearch &&
              listingCategorySections.length === 0 &&
              mainHighlightSections.map((section, index) => (
                <NetflixHomeRow
                  key={section.id}
                  id={index === 0 ? "houses" : section.id}
                  title={section.title}
                  items={section.items}
                />
              ))}

            {!hasActiveSearch &&
              listingCategorySections.length > 0 &&
              mainHighlightSections.map((section) => (
                <NetflixHomeRow
                  key={section.id}
                  title={section.title}
                  items={section.items}
                />
              ))}

            {!hasActiveSearch && hasTagSections ? (
              <div id="tags">
                {communityTagSections.map((section) => (
                  <NetflixCommunityRow
                    key={section.id}
                    title={section.title}
                    communities={section.communities}
                  />
                ))}

                {homeTagSections.map((section) => (
                  <NetflixHomeRow
                    key={section.id}
                    title={section.title}
                    items={section.items}
                  />
                ))}
              </div>
            ) : null}

            {!hasActiveSearch && <NetflixLendersRow />}

            {!hasActiveSearch &&
              citySections.map((section, index) => (
                <NetflixCommunityRow
                  key={section.id}
                  id={index === 0 ? "cities" : section.id}
                  title={section.title}
                  communities={section.communities}
                />
              ))}

            {!hasActiveSearch && (
              <NetflixCommunityRow
                title="All Communities"
                id={
                  featuredCommunityRow.length > 0 ? "all-communities" : "communities"
                }
                communities={filtered}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
