"use client";

import Link from "next/link";
import { useState } from "react";

import { PreviaxLogo } from "@/components/layout/previax-logo";
import { BuildersWorkspace } from "@/components/dashboard/builders-workspace";
import { CommunitiesWorkspace } from "@/components/dashboard/communities-workspace";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { FeaturedForm } from "@/components/dashboard/featured-form";
import { FeaturedList } from "@/components/dashboard/featured-list";
import { FeaturedCommunitiesManager } from "@/components/dashboard/featured-communities-manager";
import { LendersWorkspace } from "@/components/dashboard/lenders-workspace";
import { Top10CommunitiesManager } from "@/components/dashboard/top-10-communities-manager";
import { useData } from "@/context/data-context";
import type { DashboardTab, FeaturedItem } from "@/lib/types";

export default function DashboardPage() {
  const { isLoaded, error, communities, builders } = useData();
  const [tab, setTab] = useState<DashboardTab>("overview");
  const [editingFeatured, setEditingFeatured] = useState<FeaturedItem | null>(
    null,
  );

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <PreviaxLogo height={48} asLink={false} />
            <div>
              <h1 className="font-heading text-2xl">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                {builders.length} builder{builders.length === 1 ? "" : "s"} ·{" "}
                {communities.length} communit
                {communities.length === 1 ? "y" : "ies"}
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            ← View site
          </Link>
        </div>
      </header>

      {error && (
        <div className="mx-auto max-w-7xl px-6 py-4">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      <div className="mx-auto flex max-w-7xl gap-8 px-6 py-8">
        <DashboardSidebar active={tab} onChange={setTab} />

        <main className="min-w-0 flex-1">
          {tab === "overview" && (
            <DashboardOverview onNavigate={setTab} />
          )}

          {tab === "builders" && <BuildersWorkspace />}

          {tab === "communities" && <CommunitiesWorkspace />}

          {tab === "lenders" && <LendersWorkspace />}

          {tab === "featured" && (
            <div className="space-y-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Others
                </p>
                <h2 className="font-heading mt-1 text-2xl">Featured Carousel</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Homepage hero slides — YouTube videos that rotate every 10
                  seconds.
                </p>
              </div>
              <div className="grid gap-8 xl:grid-cols-2">
                <FeaturedForm
                  key={editingFeatured?.id ?? "new-featured"}
                  editingItem={editingFeatured}
                  onEditComplete={() => setEditingFeatured(null)}
                />
                <FeaturedList onEdit={setEditingFeatured} />
              </div>
            </div>
          )}

          {tab === "featured-communities" && (
            <div className="space-y-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Others
              </p>
              <FeaturedCommunitiesManager />
            </div>
          )}

          {tab === "top-10" && (
            <div className="space-y-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Others
              </p>
              <Top10CommunitiesManager />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
