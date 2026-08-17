"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckSquare,
  Clock,
  Loader2,
  Map,
  MapPin,
  Mic,
  Search,
  Sparkles,
  X,
} from "lucide-react";

import { useBuyer } from "@/context/buyer-context";
import { useData } from "@/context/data-context";
import { useAiSearch } from "@/hooks/use-ai-search";
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
  subscribeBuyerStorage,
} from "@/lib/buyer-storage";
import { getUniqueCities } from "@/lib/community-utils";
import { NAV_COMMUNITIES_ID } from "@/lib/homepage-nav";
import { APP_HOME, appHash } from "@/lib/routes";

const SUGGESTED_PROMPTS = [
  "3 bed under $400K near good schools",
  "Gated community with new construction",
  "Move-in ready homes with builder offers",
  "Single-story homes under $500K",
  "Family-friendly community with pool and trails",
] as const;

const QUICK_TAGS = [
  { label: "Good schools", query: "community with good schools" },
  { label: "New construction", query: "new construction homes" },
  { label: "Gated & safe", query: "gated safe community" },
  { label: "Builder offers", query: "homes with builder offers" },
  { label: "Under $400K", query: "homes under $400K" },
  { label: "3+ bedrooms", query: "3 bedroom homes" },
  { label: "One-level", query: "single story one level homes" },
  { label: "Near schools", query: "near top rated schools" },
] as const;

type NetflixSearchOverlayProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NetflixSearchOverlay({
  open,
  onOpenChange,
}: NetflixSearchOverlayProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { communities } = useData();
  const {
    searchQuery,
    setSearchQuery,
    guidancePrefs,
    viewedCities,
    aiSearchLoading,
  } = useBuyer();
  const { runAiSearch } = useAiSearch(communities);
  const inputRef = useRef<HTMLInputElement>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [draft, setDraft] = useState(searchQuery);

  useEffect(() => {
    if (!open) return;
    setDraft(searchQuery);
    setRecentSearches(getRecentSearches());
    const t = setTimeout(() => inputRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, [open, searchQuery]);

  useEffect(() => {
    if (!open) return;
    return subscribeBuyerStorage(() => {
      setRecentSearches(getRecentSearches());
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onOpenChange, open]);

  const executeSearch = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;

      setSearchQuery(trimmed);
      addRecentSearch(trimmed);
      onOpenChange(false);

      if (pathname !== APP_HOME) {
        router.push(`${APP_HOME}?q=${encodeURIComponent(trimmed)}`);
        return;
      }

      await runAiSearch(trimmed);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [onOpenChange, pathname, router, runAiSearch, setSearchQuery],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await executeSearch(draft);
  }

  function handleNearby() {
    const city =
      viewedCities[viewedCities.length - 1] ??
      (guidancePrefs?.city && guidancePrefs.city !== "any-city"
        ? guidancePrefs.city
        : getUniqueCities(communities)[0] ?? "North Carolina");
    void executeSearch(`New homes near ${city} with good schools`);
  }

  function handleBrowseMap() {
    onOpenChange(false);
    if (pathname !== APP_HOME) {
      router.push(appHash(NAV_COMMUNITIES_ID));
      return;
    }
    window.location.hash = "cities";
    document.getElementById("cities")?.scrollIntoView({ behavior: "smooth" });
  }

  function handleTakeQuiz() {
    onOpenChange(false);
    router.push("/guidance");
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[max(4.5rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Smart search"
    >
      <button
        type="button"
        aria-label="Close search"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => onOpenChange(false)}
      />

      <div className="search-overlay-panel relative z-10 flex max-h-[min(88dvh,calc(100dvh-env(safe-area-inset-bottom)-5rem))] w-full max-w-2xl flex-col overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-300">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-[#f5f5f5] px-4 py-2.5 shadow-2xl sm:px-5 sm:py-3"
        >
          <Sparkles className="size-5 shrink-0 text-[#e50914]" />
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="3 bedroom homes in Raleigh, NC..."
            disabled={aiSearchLoading}
            className="min-w-0 flex-1 bg-transparent text-base text-[#141414] outline-none placeholder:text-[#808080] sm:text-lg"
          />
          <button
            type="button"
            aria-label="Voice search (coming soon)"
            className="hidden shrink-0 rounded-full p-2 text-[#666] transition-colors hover:bg-black/5 sm:block"
            disabled
          >
            <Mic className="size-5" />
          </button>
          <button
            type="submit"
            disabled={aiSearchLoading || !draft.trim()}
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e50914] text-white transition-transform hover:scale-105 disabled:opacity-50"
            aria-label="Search"
          >
            {aiSearchLoading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Search className="size-5" />
            )}
          </button>
        </form>

        <div className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-white shadow-2xl">
          <div className="divide-y divide-[#ebebeb]">
            <button
              type="button"
              onClick={() => inputRef.current?.focus()}
              className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#f7f7f7]"
            >
              <Sparkles className="size-5 shrink-0 text-[#141414]" />
              <span className="text-base font-medium text-[#141414]">
                Search with AI Assistant
              </span>
            </button>

            <button
              type="button"
              onClick={handleNearby}
              className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#f7f7f7]"
            >
              <MapPin className="size-5 shrink-0 text-[#141414]" />
              <span className="text-base font-medium text-[#141414]">
                Search nearby
              </span>
            </button>

            <button
              type="button"
              onClick={handleBrowseMap}
              className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#f7f7f7]"
            >
              <Map className="size-5 shrink-0 text-[#141414]" />
              <span className="text-base font-medium text-[#141414]">
                Browse by city
              </span>
            </button>

            <button
              type="button"
              onClick={handleTakeQuiz}
              className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#f7f7f7]"
            >
              <CheckSquare className="size-5 shrink-0 text-[#141414]" />
              <span className="text-base font-medium text-[#141414]">
                Take our quiz
              </span>
            </button>
          </div>

          <div className="border-t border-[#ebebeb] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#808080]">
              Try asking
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK_TAGS.map(({ label, query }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => void executeSearch(query)}
                  className="rounded-full border border-[#ddd] bg-[#fafafa] px-3 py-1.5 text-xs font-medium text-[#333] transition-colors hover:border-[#e50914] hover:bg-[#fff5f5] hover:text-[#e50914]"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-[#ebebeb] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#808080]">
              Example prompts
            </p>
            <ul className="mt-2 space-y-1">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <li key={prompt}>
                  <button
                    type="button"
                    onClick={() => void executeSearch(prompt)}
                    className="w-full rounded-lg px-2 py-2 text-left text-sm text-[#555] transition-colors hover:bg-[#f7f7f7] hover:text-[#141414]"
                  >
                    {prompt}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {recentSearches.length > 0 && (
            <div className="border-t border-[#ebebeb] px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-[#141414]" />
                  <p className="text-sm font-semibold text-[#141414]">
                    Recent searches
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => clearRecentSearches()}
                  className="text-xs text-[#808080] hover:text-[#141414]"
                >
                  Clear
                </button>
              </div>
              <ul className="mt-2 space-y-1">
                {recentSearches.map((query) => (
                  <li key={query}>
                    <button
                      type="button"
                      onClick={() => void executeSearch(query)}
                      className="w-full rounded-lg px-2 py-2 text-left text-sm text-[#666] transition-colors hover:bg-[#f7f7f7] hover:text-[#141414]"
                    >
                      {query}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-[#ebebeb] px-5 py-3 text-xs text-[#999]">
            <span>AI understands English & Spanish</span>
            <Link
              href="/guidance"
              onClick={() => onOpenChange(false)}
              className="font-medium text-[#e50914] hover:underline"
            >
              Improve my matches
            </Link>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute -right-2 -top-2 flex size-8 items-center justify-center rounded-full bg-[#333] text-white shadow-lg transition-colors hover:bg-[#444] sm:-right-3 sm:-top-3"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
