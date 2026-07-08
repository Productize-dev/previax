"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  useState,
} from "react";

import {
  clearBuyerProfile,
  getBuyerProfile,
  getSavedCommunityIds,
  saveBuyerProfile,
  subscribeBuyerStorage,
  toggleSavedCommunity,
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
  buyer: BuyerProfile | null;
  toggleSaved: (id: string) => void;
  isSaved: (id: string) => boolean;
  signIn: (profile: BuyerProfile) => void;
  signOut: () => void;
};

const BuyerContext = createContext<BuyerContextValue | null>(null);

const serverSaved: string[] = [];

function getServerSaved(): string[] {
  return serverSaved;
}

function getServerBuyer(): BuyerProfile | null {
  return null;
}

export function BuyerProvider({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [offersOnly, setOffersOnly] = useState(false);

  const savedIds = useSyncExternalStore(
    subscribeBuyerStorage,
    getSavedCommunityIds,
    getServerSaved,
  );
  const buyer = useSyncExternalStore(
    subscribeBuyerStorage,
    getBuyerProfile,
    getServerBuyer,
  );

  const isSavedFn = useCallback(
    (id: string) => savedIds.includes(id),
    [savedIds],
  );

  const toggleSaved = useCallback((id: string) => {
    toggleSavedCommunity(id);
  }, []);

  const signIn = useCallback((profile: BuyerProfile) => {
    saveBuyerProfile(profile);
  }, []);

  const signOut = useCallback(() => {
    clearBuyerProfile();
  }, []);

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
        buyer,
        toggleSaved,
        isSaved: isSavedFn,
        signIn,
        signOut,
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
