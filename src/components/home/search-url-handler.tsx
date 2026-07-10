"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { useBuyer } from "@/context/buyer-context";
import { useData } from "@/context/data-context";
import { useAiSearch } from "@/hooks/use-ai-search";
import { addRecentSearch } from "@/lib/buyer-storage";

export function SearchUrlHandler() {
  const searchParams = useSearchParams();
  const { communities, isLoaded } = useData();
  const { setSearchQuery } = useBuyer();
  const { runAiSearch } = useAiSearch(communities);
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    const q = searchParams.get("q")?.trim();
    if (!q || !isLoaded) return;
    if (handledRef.current === q) return;
    handledRef.current = q;

    setSearchQuery(q);
    addRecentSearch(q);
    void runAiSearch(q);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [searchParams, isLoaded, setSearchQuery, runAiSearch]);

  return null;
}
