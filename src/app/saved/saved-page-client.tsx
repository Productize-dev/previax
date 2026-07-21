"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { Bookmark, Heart, ThumbsUp } from "lucide-react";

import { CommunityCard } from "@/components/communities/community-card";
import { HomeCard } from "@/components/homes/home-card";
import { NetflixNavbar } from "@/components/home/netflix-navbar";
import { useBuyer } from "@/context/buyer-context";
import { useData } from "@/context/data-context";
import { parseHomeRef } from "@/lib/buyer-home-ref";
import { cn } from "@/lib/utils";

type TabId = "list" | "homes" | "likes";

const TABS: Array<{ id: TabId; label: string; icon: typeof Heart }> = [
  { id: "list", label: "Communities", icon: Heart },
  { id: "homes", label: "Saved homes", icon: Bookmark },
  { id: "likes", label: "Liked", icon: ThumbsUp },
];

export default function SavedPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as TabId) || "list";
  const activeTab = TABS.some((t) => t.id === tab) ? tab : "list";

  const {
    savedIds,
    savedHomeRefs,
    likedCommunityIds,
    likedHomeRefs,
  } = useBuyer();
  const { communities, isLoaded } = useData();

  const savedCommunities = useMemo(
    () =>
      communities.filter((c) => !c.isHidden && savedIds.includes(c.id)),
    [communities, savedIds],
  );

  const savedHomes = useMemo(
    () =>
      savedHomeRefs
        .map((ref) => {
          const parsed = parseHomeRef(ref);
          if (!parsed) return null;
          const community = communities.find(
            (c) => c.id === parsed.communityId && !c.isHidden,
          );
          const home = community?.homes.find((h) => h.id === parsed.homeId);
          if (!community || !home) return null;
          return { community, home };
        })
        .filter((x): x is NonNullable<typeof x> => Boolean(x)),
    [communities, savedHomeRefs],
  );

  const likedCommunities = useMemo(
    () =>
      communities.filter(
        (c) => !c.isHidden && likedCommunityIds.includes(c.id),
      ),
    [communities, likedCommunityIds],
  );

  const likedHomes = useMemo(
    () =>
      likedHomeRefs
        .map((ref) => {
          const parsed = parseHomeRef(ref);
          if (!parsed) return null;
          const community = communities.find(
            (c) => c.id === parsed.communityId && !c.isHidden,
          );
          const home = community?.homes.find((h) => h.id === parsed.homeId);
          if (!community || !home) return null;
          return { community, home };
        })
        .filter((x): x is NonNullable<typeof x> => Boolean(x)),
    [communities, likedHomeRefs],
  );

  function setTab(next: TabId) {
    router.replace(`/saved?tab=${next}`, { scroll: false });
  }

  const emptyMessage =
    activeTab === "list"
      ? "No saved communities yet."
      : activeTab === "homes"
        ? "No saved homes yet."
        : "Nothing liked yet.";

  const hasContent =
    activeTab === "list"
      ? savedCommunities.length > 0
      : activeTab === "homes"
        ? savedHomes.length > 0
        : likedCommunities.length > 0 || likedHomes.length > 0;

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <NetflixNavbar />

      <main className="mx-auto max-w-7xl px-[4%] pb-20 pt-24">
        <h1 className="text-3xl font-bold">My Library</h1>
        <p className="mt-2 text-[#b3b3b3]">
          Communities and homes you saved or liked — stored in this browser.
        </p>

        <div className="mt-8 flex gap-1 border-b border-white/10">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                activeTab === id
                  ? "border-white text-white"
                  : "border-transparent text-[#b3b3b3] hover:text-white",
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>

        {!isLoaded ? (
          <p className="mt-12 text-[#b3b3b3]">Loading...</p>
        ) : !hasContent ? (
          <div className="mt-16 text-center">
            <p className="text-[#b3b3b3]">{emptyMessage}</p>
            <Link
              href="/#communities"
              className="mt-4 inline-block text-[#46d369] hover:underline"
            >
              Browse communities
            </Link>
          </div>
        ) : activeTab === "list" ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {savedCommunities.map((c) => (
              <CommunityCard key={c.id} community={c} />
            ))}
          </div>
        ) : activeTab === "homes" ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {savedHomes.map(({ community, home }) => (
              <HomeCard
                key={`${community.id}-${home.id}`}
                home={home}
                communityId={community.id}
                communityName={community.name}
                city={community.city}
              />
            ))}
          </div>
        ) : (
          <div className="mt-8 space-y-12">
            {likedCommunities.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-semibold text-[#e5e5e5]">
                  Liked communities
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {likedCommunities.map((c) => (
                    <CommunityCard key={c.id} community={c} />
                  ))}
                </div>
              </section>
            )}
            {likedHomes.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-semibold text-[#e5e5e5]">
                  Liked homes
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {likedHomes.map(({ community, home }) => (
                    <HomeCard
                      key={`${community.id}-${home.id}`}
                      home={home}
                      communityId={community.id}
                      communityName={community.name}
                      city={community.city}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
