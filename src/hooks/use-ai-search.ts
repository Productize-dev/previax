"use client";

import { useCallback } from "react";

import { useBuyer } from "@/context/buyer-context";
import type { AiRecommendationRow } from "@/lib/ai/types";
import type { Community } from "@/lib/types";

export function useAiSearch(communities: Community[]) {
  const {
    savedIds,
    guidancePrefs,
    viewedCities,
    buyer,
    setAiSearchLoading,
    setAiSearchResult,
    setPersonalizedRows,
    setRecommendationsLoading,
    searchQuery,
  } = useBuyer();

  const runAiSearch = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query) return;

    setAiSearchLoading(true);
    try {
      const res = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          communities,
          context: {
            savedIds,
            cities: viewedCities,
            budget: guidancePrefs?.budget,
            beds: guidancePrefs?.beds,
            buyerEmail: buyer?.email,
          },
        }),
      });

      if (!res.ok) throw new Error("Search failed");
      const data = (await res.json()) as {
        filters: Parameters<typeof setAiSearchResult>[0];
        communityIds: string[];
      };
      setAiSearchResult(data.filters, data.communityIds);
    } catch {
      setAiSearchResult(null, null);
    } finally {
      setAiSearchLoading(false);
    }
  }, [
    buyer?.email,
    communities,
    guidancePrefs?.beds,
    guidancePrefs?.budget,
    savedIds,
    searchQuery,
    setAiSearchLoading,
    setAiSearchResult,
    viewedCities,
  ]);

  const loadRecommendations = useCallback(async () => {
    if (communities.length === 0) return;

    setRecommendationsLoading(true);
    try {
      const res = await fetch("/api/ai/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          communities,
          context: {
            savedIds,
            cities: [
              ...(guidancePrefs?.city && guidancePrefs.city !== "any-city"
                ? [guidancePrefs.city]
                : []),
              ...viewedCities,
            ],
            budget: guidancePrefs?.budget,
            beds: guidancePrefs?.beds,
            buyerEmail: buyer?.email,
          },
        }),
      });

      if (!res.ok) throw new Error("Recommendations failed");
      const data = (await res.json()) as { rows: AiRecommendationRow[] };
      setPersonalizedRows(data.rows);
    } catch {
      setPersonalizedRows([]);
    } finally {
      setRecommendationsLoading(false);
    }
  }, [
    buyer?.email,
    communities,
    guidancePrefs?.beds,
    guidancePrefs?.budget,
    guidancePrefs?.city,
    savedIds,
    setPersonalizedRows,
    setRecommendationsLoading,
    viewedCities,
  ]);

  return { runAiSearch, loadRecommendations };
}
