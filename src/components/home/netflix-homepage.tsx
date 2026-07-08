"use client";

import { useCallback, useMemo, useState } from "react";

import { NetflixCommunityRow } from "@/components/home/netflix-community-row";
import { NetflixHero } from "@/components/home/netflix-hero";
import { NetflixHomeRow } from "@/components/home/netflix-home-row";
import { NetflixLendersRow } from "@/components/home/netflix-lenders-row";
import { NetflixNavbar } from "@/components/home/netflix-navbar";
import { useBuyer } from "@/context/buyer-context";
import { useData } from "@/context/data-context";
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

export function NetflixHomepage() {
  const { communities, featuredCommunities, customCommunityTagLabels, isLoaded } =
    useData();
  const { searchQuery, cityFilter, offersOnly, savedIds } = useBuyer();
  const [focusCommunity, setFocusCommunity] = useState<Community | null>(null);

  const handleTrendingSelect = useCallback((community: Community) => {
    setFocusCommunity(community);
  }, []);

  const filtered = useMemo(
    () =>
      filterCommunities(communities, {
        query: searchQuery,
        city: cityFilter,
        offersOnly,
      }),
    [communities, searchQuery, cityFilter, offersOnly],
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

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <NetflixNavbar />
      <NetflixHero focusCommunity={focusCommunity} />

      <main className="relative z-10 -mt-12 space-y-1 pb-20 sm:-mt-16 md:-mt-20 md:space-y-2">
        {!isLoaded ? (
          <p className="px-[4%] py-8 text-[#808080]">Loading communities...</p>
        ) : filtered.length === 0 ? (
          <p className="px-[4%] py-8 text-[#808080]">
            No communities match your search.
          </p>
        ) : (
          <>
            {saved.length > 0 && (
              <NetflixCommunityRow title="My List" communities={saved} />
            )}

            <NetflixCommunityRow
              title="Trending Now"
              communities={trending}
              onSelect={handleTrendingSelect}
            />

            {featuredCommunityRow.length > 0 && (
              <NetflixCommunityRow
                title="Featured Communities"
                id="communities"
                communities={featuredCommunityRow}
              />
            )}

            {listingCategorySections.map((section, index) => (
              <NetflixHomeRow
                key={section.id}
                id={index === 0 ? "houses" : section.id}
                title={section.title}
                items={section.items}
              />
            ))}

            {listingCategorySections.length === 0 &&
              mainHighlightSections.map((section, index) => (
                <NetflixHomeRow
                  key={section.id}
                  id={index === 0 ? "houses" : section.id}
                  title={section.title}
                  items={section.items}
                />
              ))}

            {listingCategorySections.length > 0 &&
              mainHighlightSections.map((section) => (
                <NetflixHomeRow
                  key={section.id}
                  title={section.title}
                  items={section.items}
                />
              ))}

            {hasTagSections ? (
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
            ) : listingCategorySections.length === 0 &&
              mainHighlightSections.length === 0 &&
              homeTagSections.length > 0 ? (
              homeTagSections.map((section, index) => (
                <NetflixHomeRow
                  key={section.id}
                  id={index === 0 ? "houses" : section.id}
                  title={section.title}
                  items={section.items}
                />
              ))
            ) : null}

            <NetflixLendersRow />

            {citySections.map((section, index) => (
              <NetflixCommunityRow
                key={section.id}
                id={index === 0 ? "cities" : section.id}
                title={section.title}
                communities={section.communities}
              />
            ))}

            <NetflixCommunityRow
              title="All Communities"
              id={featuredCommunityRow.length > 0 ? "all-communities" : "communities"}
              communities={filtered}
            />
          </>
        )}
      </main>
    </div>
  );
}
