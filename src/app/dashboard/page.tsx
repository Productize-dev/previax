"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AdminOverview } from "@/components/dashboard/admin-overview";
import { DashboardOverviewSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { BuilderOverview } from "@/components/dashboard/builder-overview";
import { BuildersWorkspace } from "@/components/dashboard/builders-workspace";
import { CommunitiesWorkspace } from "@/components/dashboard/communities-workspace";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { FeaturedForm } from "@/components/dashboard/featured-form";
import { FeaturedList } from "@/components/dashboard/featured-list";
import { FeaturedCommunitiesManager } from "@/components/dashboard/featured-communities-manager";
import { LenderOverview } from "@/components/dashboard/lender-overview";
import { LendersWorkspace } from "@/components/dashboard/lenders-workspace";
import { LocalDataImportCard } from "@/components/dashboard/local-data-import-card";
import { PendingAccountsCard } from "@/components/dashboard/pending-accounts-card";
import { Top10CommunitiesManager } from "@/components/dashboard/top-10-communities-manager";
import { PreviaxLogo } from "@/components/layout/previax-logo";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { PROFILE_COLUMNS } from "@/lib/auth/profile";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { DashboardTab, FeaturedItem } from "@/lib/types";

const BUILDER_TABS: DashboardTab[] = ["overview", "builders", "communities"];
const LENDER_TABS: DashboardTab[] = ["overview", "lenders"];

export default function DashboardPage() {
  const { isLoaded, error, communities, builders, isAdmin, isBuilder, isLender } =
    useDashboardData();
  const [tab, setTab] = useState<DashboardTab>("overview");
  const [editingFeatured, setEditingFeatured] = useState<FeaturedItem | null>(
    null,
  );
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;

    void getSupabaseBrowserClient()
      .from("profiles")
      .select(PROFILE_COLUMNS, { count: "exact", head: true })
      .eq("status", "pending")
      .then(({ count }) => {
        if (!cancelled) setPendingCount(count ?? 0);
      });

    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  useEffect(() => {
    if (isBuilder && !BUILDER_TABS.includes(tab)) {
      setTab("overview");
    }
    if (isLender && !LENDER_TABS.includes(tab)) {
      setTab("overview");
    }
  }, [isBuilder, isLender, tab]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 px-6 py-5">
          <div className="mx-auto max-w-7xl">
            <h1 className="font-heading text-2xl">Dashboard</h1>
          </div>
        </header>
        <div className="mx-auto max-w-7xl px-6 py-8">
          <DashboardOverviewSkeleton />
        </div>
      </div>
    );
  }

  const subtitle = isBuilder
    ? `${builders.length} builder${builders.length === 1 ? "" : "s"} · ${communities.length} communit${communities.length === 1 ? "y" : "ies"}`
    : isLender
      ? "Lender account"
      : `${builders.length} builder${builders.length === 1 ? "" : "s"} · ${communities.length} communit${communities.length === 1 ? "y" : "ies"}`;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <PreviaxLogo height={48} asLink={false} />
            <div>
              <h1 className="font-heading text-2xl">Dashboard</h1>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              ← View site
            </Link>
            <Link
              href="/logout"
              prefetch={false}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              Sign out
            </Link>
          </div>
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
            <div className="space-y-6">
              {isAdmin && <PendingAccountsCard />}
              {isAdmin && <LocalDataImportCard />}
              {isAdmin && (
                <AdminOverview
                  onNavigate={setTab}
                  pendingCount={pendingCount}
                />
              )}
              {isBuilder && <BuilderOverview onNavigate={setTab} />}
              {isLender && <LenderOverview onNavigate={setTab} />}
            </div>
          )}

          {(isAdmin || isBuilder) && tab === "builders" && <BuildersWorkspace />}

          {(isAdmin || isBuilder) && tab === "communities" && (
            <CommunitiesWorkspace />
          )}

          {(isAdmin || isLender) && tab === "lenders" && <LendersWorkspace />}

          {isAdmin && tab === "featured" && (
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

          {isAdmin && tab === "featured-communities" && (
            <div className="space-y-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Others
              </p>
              <FeaturedCommunitiesManager />
            </div>
          )}

          {isAdmin && tab === "top-10" && (
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
