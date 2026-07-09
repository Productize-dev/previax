"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  useState,
} from "react";

import { useAuth } from "@/context/auth-context";
import {
  getSavedCommunityIds,
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
  signOut: () => void;
};

const BuyerContext = createContext<BuyerContextValue | null>(null);

const serverSaved: string[] = [];

function getServerSaved(): string[] {
  return serverSaved;
}

export function BuyerProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, signOut: authSignOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [offersOnly, setOffersOnly] = useState(false);

  const savedIds = useSyncExternalStore(
    subscribeBuyerStorage,
    getSavedCommunityIds,
    getServerSaved,
  );

  // El "buyer" ahora viene de la sesión real de Supabase Auth.
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
        buyer,
        toggleSaved,
        isSaved: isSavedFn,
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
