"use client";

import { useMemo } from "react";

import { useProfile } from "@/context/auth-context";
import { useData } from "@/context/data-context";
import { scopeDashboardData } from "@/lib/dashboard-scope";

/** Datos del dashboard filtrados por rol; mutaciones siguen en el contexto global (RLS en Supabase). */
export function useDashboardData() {
  const full = useData();
  const profile = useProfile();

  const scoped = useMemo(
    () =>
      scopeDashboardData(
        {
          builders: full.builders,
          communities: full.communities,
          series: full.series,
          lenders: full.lenders,
          lenderOffers: full.lenderOffers,
          featured: full.featured,
          featuredCommunities: full.featuredCommunities,
          top10Communities: full.top10Communities,
          homepageSeries: full.homepageSeries,
        },
        profile,
      ),
    [full, profile],
  );

  return {
    ...full,
    ...scoped,
    profile,
    isAdmin: scoped.role === "admin",
    isBuilder: scoped.role === "builder",
    isLender: scoped.role === "lender",
  };
}
