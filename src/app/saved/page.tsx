"use client";

import Link from "next/link";

import { CommunityCard } from "@/components/communities/community-card";
import { Navbar } from "@/components/layout/navbar";
import { SiteFooter } from "@/components/layout/site-footer";
import { useBuyer } from "@/context/buyer-context";
import { useData } from "@/context/data-context";

export default function SavedPage() {
  const { savedIds } = useBuyer();
  const { communities, isLoaded } = useData();

  const saved = communities.filter((c) => savedIds.includes(c.id));

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="font-heading text-3xl">Saved Communities</h1>
        <p className="mt-2 text-muted-foreground">
          Your saved list is stored in this browser — no account required.
        </p>

        {!isLoaded ? (
          <p className="mt-8 text-muted-foreground">Loading...</p>
        ) : saved.length === 0 ? (
          <div className="mt-12 text-center">
            <p className="text-muted-foreground">No saved communities yet.</p>
            <Link href="/#communities" className="mt-4 inline-block text-primary hover:underline">
              Browse communities
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((c) => (
              <CommunityCard key={c.id} community={c} />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
