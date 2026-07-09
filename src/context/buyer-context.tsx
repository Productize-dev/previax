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
import {
  getGuidancePrefs,
  getSavedCommunityIds,
  getViewedCities,
  subscribeBuyerStorage,
  toggleSavedCommunity,
  type BuyerGuidancePrefs,
} from "@/lib/buyer-storage";
import type { BuyerProfile } from "@/lib/types";

type BuyerContextValue = {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  cityFilter: string;
  setCityFilter: (city: string) => void;
  offersOnly: boolean;
  setOffersOnly: (v: boolean) => void;
  savedIds: string[];
  guidancePrefs: BuyerGuidancePrefs | null;
  viewedCities: string[];
  buyer: BuyerProfile | null;
  toggleSaved: (id: string) => void;
  isSaved: (id: string) => boolean;
  signOut: () => void;
  /** Filtros estructurados de la última búsqueda IA. */
  aiFilters: AiSearchFilters | null;
  /** IDs ordenados del resultado IA (null = búsqueda local). */
  aiCommunityIds: string[] | null;
  aiSearchLoading: boolean;
  personalizedRows: AiRecommendationRow[];
  recommendationsLoading: boolean;
  clearAiSearch: () => void;
  setAiSearchResult: (
    filters: AiSearchFilters | null,
    communityIds: string[] | null,
  ) => void;
  setAiSearchLoading: (loading: boolean) => void;
  setPersonalizedRows: (rows: AiRecommendationRow[]) => void;
  setRecommendationsLoading: (loading: boolean) => void;
};

const BuyerContext = createContext<BuyerContextValue | null>(null);

const serverSaved: string[] = [];
const serverViewed: string[] = [];
const serverGuidance: BuyerGuidancePrefs | null = null;

function getServerSaved(): string[] {
  return serverSaved;
}

function getServerViewed(): string[] {
  return serverViewed;
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
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [personalizedRows, setPersonalizedRows] = useState<AiRecommendationRow[]>(
    [],
  );
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  const savedIds = useSyncExternalStore(
    subscribeBuyerStorage,
    getSavedCommunityIds,
    getServerSaved,
  );

  const guidancePrefs = useSyncExternalStore(
    subscribeBuyerStorage,
    getGuidancePrefs,
    getServerGuidance,
  );

  const viewedCities = useSyncExternalStore(
    subscribeBuyerStorage,
    getViewedCities,
    getServerViewed,
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
    }
  }, []);

  const clearAiSearch = useCallback(() => {
    setAiFilters(null);
    setAiCommunityIds(null);
    setSearchQueryState("");
    setCityFilter("all");
    setOffersOnly(false);
  }, []);

  const setAiSearchResult = useCallback(
    (filters: AiSearchFilters | null, communityIds: string[] | null) => {
      setAiFilters(filters);
      setAiCommunityIds(communityIds);
      if (filters?.city) setCityFilter(filters.city);
      if (filters?.offersOnly) setOffersOnly(true);
    },
    [],
  );

  const isSavedFn = useCallback(
    (id: string) => savedIds.includes(id),
    [savedIds],
  );

  const toggleSaved = useCallback((id: string) => {
    toggleSavedCommunity(id);
  }, []);

  const signOut = useCallback(() => {
    void authSignOut();
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
        guidancePrefs,
        viewedCities,
        buyer,
        toggleSaved,
        isSaved: isSavedFn,
        signOut,
        aiFilters,
        aiCommunityIds,
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
