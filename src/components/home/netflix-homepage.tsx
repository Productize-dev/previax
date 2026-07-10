"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  resolveHomepageSectionTitle,
  resolveHomepageSections,
  resolveTop10Communities,
} from "@/lib/homepage-layout";
import {
  buildCitySections,
  buildCommunityTagSections,
  buildHomeTagSections,
  buildListingCategorySections,
  buildMainHighlightSections,
  collectAvailableHomes,
} from "@/lib/homepage-sections";
import { parseHomeRef } from "@/lib/buyer-home-ref";
import type { HomeRowItem } from "@/lib/homepage-sections";
import type { Community, HomepageSection, HomepageSectionKey } from "@/lib/types";

function resolveHomeRowItems(
  refs: string[],
  communities: Community[],
): HomeRowItem[] {
  return refs
    .map((ref) => {
      const parsed = parseHomeRef(ref);
      if (!parsed) return null;
      const community = communities.find((c) => c.id === parsed.communityId);
      const home = community?.homes.find((h) => h.id === parsed.homeId);
      if (!community || !home) return null;
      return { home, community };
    })
    .filter((x): x is HomeRowItem => Boolean(x));
}

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

function isSectionVisible(
  sections: HomepageSection[],
  key: HomepageSectionKey,
): boolean {
  return sections.some((section) => section.sectionKey === key);
}

export function NetflixHomepage() {
  const {
    communities,
    featuredCommunities,
    top10Communities,
    homepageSections,
    customCommunityTagLabels,
    isLoaded,
  } = useData();
  const {
    searchQuery,
    cityFilter,
    offersOnly,
    savedIds,
    savedHomeRefs,
    likedCommunityIds,
    likedHomeRefs,
    aiCommunityIds,
    aiFilters,
    aiSearchMatchMode,
    aiSearchExactCount,
    aiSearchLoading,
    personalizedRows,
  } = useBuyer();
  const { loadRecommendations } = useAiSearch(communities);
  const [focusCommunity, setFocusCommunity] = useState<Community | null>(null);
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const layoutSections = useMemo(
    () => resolveHomepageSections(homepageSections),
    [homepageSections],
  );

  useEffect(() => {
    if (isLoaded && communities.length > 0) {
      void loadRecommendations();
    }
  }, [isLoaded, communities.length, loadRecommendations]);

  useEffect(() => {
    return () => {
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    };
  }, []);

  const handleTrendingSelect = useCallback((community: Community) => {
    if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    focusTimerRef.current = setTimeout(() => {
      setFocusCommunity(community);
    }, 400);
  }, []);

  const handleTrendingDeselect = useCallback(() => {
    if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    setFocusCommunity(null);
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

  const searchHomeItems = useMemo(
    () => collectAvailableHomes(filtered).slice(0, 24),
    [filtered],
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

  const top10Row = useMemo(
    () => resolveTop10Communities(top10Communities, communities, filtered),
    [top10Communities, communities, filtered],
  );

  const saved = useMemo(
    () =>
      savedIds
        .map((id) => communities.find((c) => c.id === id))
        .filter((c): c is NonNullable<typeof c> => Boolean(c)),
    [communities, savedIds],
  );

  const savedHomes = useMemo(
    () => resolveHomeRowItems(savedHomeRefs, communities),
    [communities, savedHomeRefs],
  );

  const likedCommunities = useMemo(
    () =>
      likedCommunityIds
        .map((id) => communities.find((c) => c.id === id))
        .filter((c): c is Community => Boolean(c)),
    [communities, likedCommunityIds],
  );

  const likedHomes = useMemo(
    () => resolveHomeRowItems(likedHomeRefs, communities),
    [communities, likedHomeRefs],
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

  const showSkeleton = !isLoaded || aiSearchLoading;

  const hasActiveSearch =
    Boolean(searchQuery.trim()) ||
    aiCommunityIds !== null ||
    aiFilters !== null;

  const sectionByKey = useMemo(
    () => new Map(layoutSections.map((section) => [section.sectionKey, section])),
    [layoutSections],
  );

  const showHero =
    !hasActiveSearch && isSectionVisible(layoutSections, "hero");

  const trendingTitle = sectionByKey.get("trending")
    ? resolveHomepageSectionTitle(sectionByKey.get("trending")!)
    : "Search results";

  function renderBrowseSection(section: HomepageSection) {
    const title = resolveHomepageSectionTitle(section);

    switch (section.sectionKey) {
      case "hero":
        return null;

      case "personalized":
        return personalizedRows.map((row) => {
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
        });

      case "my-list":
        if (saved.length === 0) return null;
        return <NetflixCommunityRow title={title} communities={saved} />;

      case "saved-homes":
        if (savedHomes.length === 0) return null;
        return <NetflixHomeRow title={title} items={savedHomes} />;

      case "liked-communities":
        if (likedCommunities.length === 0) return null;
        return (
          <NetflixCommunityRow title={title} communities={likedCommunities} />
        );

      case "liked-homes":
        if (likedHomes.length === 0) return null;
        return <NetflixHomeRow title={title} items={likedHomes} />;

      case "trending":
        return (
          <NetflixCommunityRow
            title={title}
            communities={trending}
            onSelect={handleTrendingSelect}
            onDeselect={handleTrendingDeselect}
          />
        );

      case "featured-communities":
        if (featuredCommunityRow.length === 0) return null;
        return (
          <NetflixCommunityRow
            title={title}
            id="communities"
            communities={featuredCommunityRow}
          />
        );

      case "top-10":
        if (top10Row.length === 0) return null;
        return (
          <NetflixCommunityRow title={title} communities={top10Row} />
        );

      case "listing-categories":
        if (listingCategorySections.length === 0) return null;
        return listingCategorySections.map((categorySection, index) => (
          <NetflixHomeRow
            key={categorySection.id}
            id={index === 0 ? "houses" : categorySection.id}
            title={categorySection.title}
            items={categorySection.items}
          />
        ));

      case "main-highlights":
        if (mainHighlightSections.length === 0) return null;
        return mainHighlightSections.map((highlightSection, index) => (
          <NetflixHomeRow
            key={highlightSection.id}
            id={
              !isSectionVisible(layoutSections, "listing-categories") &&
              index === 0
                ? "houses"
                : highlightSection.id
            }
            title={highlightSection.title}
            items={highlightSection.items}
          />
        ));

      case "community-tags":
        if (communityTagSections.length === 0) return null;
        return communityTagSections.map((tagSection) => (
          <NetflixCommunityRow
            key={tagSection.id}
            title={tagSection.title}
            communities={tagSection.communities}
          />
        ));

      case "home-tags":
        if (homeTagSections.length === 0) return null;
        return homeTagSections.map((tagSection) => (
          <NetflixHomeRow
            key={tagSection.id}
            title={tagSection.title}
            items={tagSection.items}
          />
        ));

      case "lenders":
        return <NetflixLendersRow />;

      case "cities":
        if (citySections.length === 0) return null;
        return citySections.map((citySection, index) => (
          <NetflixCommunityRow
            key={citySection.id}
            id={index === 0 ? "cities" : citySection.id}
            title={citySection.title}
            communities={citySection.communities}
          />
        ));

      case "all-communities":
        return (
          <NetflixCommunityRow
            title={title}
            id={
              featuredCommunityRow.length > 0 ? "all-communities" : "communities"
            }
            communities={filtered}
          />
        );

      default:
        return null;
    }
  }

  let tagsAnchorAssigned = false;

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <NetflixNavbar />

      {showHero && <NetflixHero focusCommunity={focusCommunity} />}

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
            No communities found. Try a broader search — city only, fewer filters,
            or a higher budget.
          </p>
        ) : (
          <>
            {hasActiveSearch && aiCommunityIds !== null && (
              <p className="px-[4%] pb-2 text-sm text-[#b3b3b3]">
                {aiSearchMatchMode === "exact" && (
                  <>
                    {filtered.length} result{filtered.length === 1 ? "" : "s"}{" "}
                    for &quot;{searchQuery}&quot;
                  </>
                )}
                {aiSearchMatchMode === "similar" && (
                  <>
                    No exact matches for &quot;{searchQuery}&quot; — showing{" "}
                    {filtered.length} similar communit
                    {filtered.length === 1 ? "y" : "ies"}
                    {aiSearchExactCount > 0 &&
                      ` (${aiSearchExactCount} close match${aiSearchExactCount === 1 ? "" : "es"})`}
                  </>
                )}
                {aiSearchMatchMode === "semantic" && (
                  <>
                    Related to &quot;{searchQuery}&quot; — {filtered.length}{" "}
                    communit{filtered.length === 1 ? "y" : "ies"} by meaning
                  </>
                )}
                {!aiSearchMatchMode && (
                  <>
                    {filtered.length} result{filtered.length === 1 ? "" : "s"}{" "}
                    for &quot;{searchQuery}&quot;
                  </>
                )}
              </p>
            )}

            {hasActiveSearch ? (
              <>
                {isSectionVisible(layoutSections, "trending") && (
                  <NetflixCommunityRow
                    title={trendingTitle}
                    communities={filtered}
                  />
                )}

                {searchHomeItems.length > 0 && (
                  <NetflixHomeRow
                    title={
                      aiSearchMatchMode === "exact"
                        ? "Matching homes"
                        : "Similar homes"
                    }
                    items={searchHomeItems}
                  />
                )}
              </>
            ) : (
              layoutSections.map((section) => {
                if (section.sectionKey === "hero") return null;
                const rendered = renderBrowseSection(section);
                if (!rendered) return null;

                const isTagSection =
                  section.sectionKey === "community-tags" ||
                  section.sectionKey === "home-tags";

                if (!tagsAnchorAssigned && isTagSection) {
                  tagsAnchorAssigned = true;
                  return (
                    <div key={section.id} id="tags">
                      {rendered}
                    </div>
                  );
                }

                return <div key={section.id}>{rendered}</div>;
              })
            )}
          </>
        )}
      </main>
    </div>
  );
}
