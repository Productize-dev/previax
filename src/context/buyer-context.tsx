"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  useState,
} from "react";

import { useAuth } from "@/context/auth-context";
import type { AiRecommendationRow, AiSearchFilters } from "@/lib/ai/types";
import type { AiSearchMatchMode } from "@/lib/ai/smart-search";
import {
  getGuidancePrefs,
  getLikedCommunityIds,
  getLikedHomeRefs,
  getSavedApartmentIds,
  getSavedCommunityIds,
  getSavedHomeRefs,
  getViewedCities,
  subscribeBuyerStorage,
  toggleLikedCommunity,
  toggleLikedHome,
  toggleSavedApartment,
  toggleSavedCommunity,
  toggleSavedHome,
  type BuyerGuidancePrefs,
} from "@/lib/buyer-storage";
import { trackCommunityEvent } from "@/lib/analytics";
import type { BuyerProfile } from "@/lib/types";

type BuyerContextValue = {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  cityFilter: string;
  setCityFilter: (city: string) => void;
  offersOnly: boolean;
  setOffersOnly: (v: boolean) => void;
  savedIds: string[];
  savedHomeRefs: string[];
  savedApartmentIds: string[];
  likedCommunityIds: string[];
  likedHomeRefs: string[];
  guidancePrefs: BuyerGuidancePrefs | null;
  viewedCities: string[];
  buyer: BuyerProfile | null;
  toggleSaved: (id: string) => void;
  toggleSavedHome: (communityId: string, homeId: string) => void;
  toggleSavedApartment: (id: string) => void;
  toggleLikedCommunity: (id: string) => void;
  toggleLikedHome: (communityId: string, homeId: string) => void;
  isSaved: (id: string) => boolean;
  isHomeSaved: (communityId: string, homeId: string) => boolean;
  isApartmentSaved: (id: string) => boolean;
  isLiked: (id: string) => boolean;
  isHomeLiked: (communityId: string, homeId: string) => boolean;
  signOut: () => Promise<void>;
  aiFilters: AiSearchFilters | null;
  aiCommunityIds: string[] | null;
  aiSearchMatchMode: AiSearchMatchMode | null;
  aiSearchExactCount: number;
  aiSearchLoading: boolean;
  personalizedRows: AiRecommendationRow[];
  recommendationsLoading: boolean;
  clearAiSearch: () => void;
  setAiSearchResult: (
    filters: AiSearchFilters | null,
    communityIds: string[] | null,
    meta?: { matchMode?: AiSearchMatchMode; exactCount?: number },
  ) => void;
  setAiSearchLoading: (loading: boolean) => void;
  setPersonalizedRows: (rows: AiRecommendationRow[]) => void;
  setRecommendationsLoading: (loading: boolean) => void;
};

const BuyerContext = createContext<BuyerContextValue | null>(null);

const serverEmpty: string[] = [];
const serverGuidance: BuyerGuidancePrefs | null = null;

function getServerEmpty(): string[] {
  return serverEmpty;
}

function getServerGuidance(): BuyerGuidancePrefs | null {
  return serverGuidance;
}

export function BuyerProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, signOut: authSignOut } = useAuth();
  const [searchQuery, setSearchQueryState] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [offersOnly, setOffersOnly] = useState(false);
  const [aiFilters, setAiFilters] = useState<AiSearchFilters | null>(null);
  const [aiCommunityIds, setAiCommunityIds] = useState<string[] | null>(null);
  const [aiSearchMatchMode, setAiSearchMatchMode] =
    useState<AiSearchMatchMode | null>(null);
  const [aiSearchExactCount, setAiSearchExactCount] = useState(0);
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [personalizedRows, setPersonalizedRows] = useState<AiRecommendationRow[]>(
    [],
  );
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  const savedIds = useSyncExternalStore(
    subscribeBuyerStorage,
    getSavedCommunityIds,
    getServerEmpty,
  );

  const savedHomeRefs = useSyncExternalStore(
    subscribeBuyerStorage,
    getSavedHomeRefs,
    getServerEmpty,
  );

  const savedApartmentIds = useSyncExternalStore(
    subscribeBuyerStorage,
    getSavedApartmentIds,
    getServerEmpty,
  );

  const likedCommunityIds = useSyncExternalStore(
    subscribeBuyerStorage,
    getLikedCommunityIds,
    getServerEmpty,
  );

  const likedHomeRefs = useSyncExternalStore(
    subscribeBuyerStorage,
    getLikedHomeRefs,
    getServerEmpty,
  );

  const guidancePrefs = useSyncExternalStore(
    subscribeBuyerStorage,
    getGuidancePrefs,
    getServerGuidance,
  );

  const viewedCities = useSyncExternalStore(
    subscribeBuyerStorage,
    getViewedCities,
    getServerEmpty,
  );

  const buyer: BuyerProfile | null = user
    ? {
        name:
          profile?.fullName ||
          (user.user_metadata?.full_name as string | undefined) ||
          user.email?.split("@")[0] ||
          "Account",
        email: profile?.email ?? user.email ?? "",
      }
    : null;

  const setSearchQuery = useCallback((q: string) => {
    setSearchQueryState(q);
    if (!q.trim()) {
      setAiFilters(null);
      setAiCommunityIds(null);
      setAiSearchMatchMode(null);
      setAiSearchExactCount(0);
    }
  }, []);

  const clearAiSearch = useCallback(() => {
    setAiFilters(null);
    setAiCommunityIds(null);
    setAiSearchMatchMode(null);
    setAiSearchExactCount(0);
    setSearchQueryState("");
    setCityFilter("all");
    setOffersOnly(false);
  }, []);

  const setAiSearchResult = useCallback(
    (
      filters: AiSearchFilters | null,
      communityIds: string[] | null,
      meta?: { matchMode?: AiSearchMatchMode; exactCount?: number },
    ) => {
      setAiFilters(filters);
      setAiCommunityIds(communityIds);
      setAiSearchMatchMode(meta?.matchMode ?? null);
      setAiSearchExactCount(meta?.exactCount ?? 0);
      if (filters?.city) setCityFilter(filters.city);
      if (filters?.offersOnly) setOffersOnly(true);
    },
    [],
  );

  const isSavedFn = useCallback(
    (id: string) => savedIds.includes(id),
    [savedIds],
  );

  const isHomeSavedFn = useCallback(
    (communityId: string, homeId: string) =>
      savedHomeRefs.includes(`${communityId}:${homeId}`),
    [savedHomeRefs],
  );

  const isApartmentSavedFn = useCallback(
    (id: string) => savedApartmentIds.includes(id),
    [savedApartmentIds],
  );

  const isLikedFn = useCallback(
    (id: string) => likedCommunityIds.includes(id),
    [likedCommunityIds],
  );

  const isHomeLikedFn = useCallback(
    (communityId: string, homeId: string) =>
      likedHomeRefs.includes(`${communityId}:${homeId}`),
    [likedHomeRefs],
  );

  const toggleSaved = useCallback((id: string) => {
    const wasSaved = getSavedCommunityIds().includes(id);
    toggleSavedCommunity(id);
    void trackCommunityEvent(
      id,
      wasSaved ? "community_unsaved" : "community_saved",
    );
  }, []);

  const toggleSavedHomeFn = useCallback((communityId: string, homeId: string) => {
    toggleSavedHome(communityId, homeId);
  }, []);

  const toggleSavedApartmentFn = useCallback((id: string) => {
    toggleSavedApartment(id);
  }, []);

  const toggleLikedCommunityFn = useCallback((id: string) => {
    toggleLikedCommunity(id);
  }, []);

  const toggleLikedHomeFn = useCallback((communityId: string, homeId: string) => {
    toggleLikedHome(communityId, homeId);
  }, []);

  const signOut = useCallback(async () => {
    await authSignOut();
  }, [authSignOut]);

  return (
    <BuyerContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        cityFilter,
        setCityFilter,
        offersOnly,
        setOffersOnly,
        savedIds,
        savedHomeRefs,
        savedApartmentIds,
        likedCommunityIds,
        likedHomeRefs,
        guidancePrefs,
        viewedCities,
        buyer,
        toggleSaved,
        toggleSavedHome: toggleSavedHomeFn,
        toggleSavedApartment: toggleSavedApartmentFn,
        toggleLikedCommunity: toggleLikedCommunityFn,
        toggleLikedHome: toggleLikedHomeFn,
        isSaved: isSavedFn,
        isHomeSaved: isHomeSavedFn,
        isApartmentSaved: isApartmentSavedFn,
        isLiked: isLikedFn,
        isHomeLiked: isHomeLikedFn,
        signOut,
        aiFilters,
        aiCommunityIds,
        aiSearchMatchMode,
        aiSearchExactCount,
        aiSearchLoading,
        personalizedRows,
        recommendationsLoading,
        clearAiSearch,
        setAiSearchResult,
        setAiSearchLoading,
        setPersonalizedRows,
        setRecommendationsLoading,
      }}
    >
      {children}
    </BuyerContext.Provider>
  );
}

export function useBuyer() {
  const ctx = useContext(BuyerContext);
  if (!ctx) throw new Error("useBuyer must be used within BuyerProvider");
  return ctx;
}
