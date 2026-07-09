"use client";

import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  mapProfileRow,
  PROFILE_COLUMNS,
  type ProfileRow,
} from "@/lib/auth/profile";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

type AuthContextValue = {
  user: User | null;
  profile: Profile | null;
  /** true cuando ya se resolvió la sesión inicial. */
  isLoaded: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await getSupabaseBrowserClient()
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();
  return data ? mapProfileRow(data as ProfileRow) : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let cancelled = false;

    async function applyUser(nextUser: User | null) {
      if (cancelled) return;
      setUser(nextUser);
      if (nextUser) {
        const nextProfile = await fetchProfile(nextUser.id);
        if (!cancelled) setProfile(nextProfile);
      } else {
        setProfile(null);
      }
      if (!cancelled) setIsLoaded(true);
    }

    void supabase.auth.getSession().then(({ data: { session } }) => {
      void applyUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void applyUser(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    await getSupabaseBrowserClient().auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    setProfile(await fetchProfile(user.id));
  }, [user]);

  return (
    <AuthContext.Provider
      value={{ user, profile, isLoaded, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** { id, role, status } del usuario actual, o null si no hay sesión. */
export function useProfile(): Profile | null {
  return useAuth().profile;
}
