"use client";

import { Building2, Hammer, Home, Plus, Star, Trophy } from "lucide-react";

import { StatTile } from "@/components/dashboard/stat-tile";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import type { DashboardTab } from "@/lib/types";

type BuilderOverviewProps = {
  onNavigate: (tab: DashboardTab) => void;
};

export function BuilderOverview({ onNavigate }: BuilderOverviewProps) {
  const {
    builders,
    communities,
    featuredCommunities,
    top10Communities,
  } = useDashboardData();

  const totalModels = communities.reduce(
    (sum, community) => sum + community.homes.length,
    0,
  );

  const featuredIds = new Set(featuredCommunities.map((row) => row.communityId));
  const top10Ids = new Set(top10Communities.map((slot) => slot.communityId));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Builders"
          value={builders.length}
          icon={Hammer}
          onClick={() => onNavigate("builders")}
        />
        <StatTile
          label="Communities"
          value={communities.length}
          icon={Building2}
          onClick={() => onNavigate("communities")}
        />
        <StatTile
          label="Home models"
          value={totalModels}
          icon={Home}
          onClick={() => onNavigate("communities")}
        />
        <StatTile
          label="Top 10 badges"
          value={top10Ids.size}
          icon={Trophy}
          highlight={top10Ids.size > 0}
        />
      </div>

      {communities.length === 0 ? (
        <button
          type="button"
          onClick={() => onNavigate("builders")}
          className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-12 text-center transition-colors hover:border-primary/60"
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Plus className="size-6" />
          </span>
          <span className="text-sm font-medium">Add your first community</span>
          <span className="text-xs text-muted-foreground">
            Create a builder profile, then add communities and home models.
          </span>
        </button>
      ) : (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-heading text-lg">Your communities</h3>
            <button
              type="button"
              onClick={() => onNavigate("communities")}
              className="text-sm text-primary hover:underline"
            >
              Manage →
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {communities.map((community) => (
              <button
                key={community.id}
                type="button"
                onClick={() => onNavigate("communities")}
                className="group relative aspect-video overflow-hidden rounded-xl border border-border text-left transition-colors hover:border-primary/60"
              >
                {community.thumbnailUrl ? (
                  <img
                    src={community.thumbnailUrl}
                    alt=""
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-muted">
                    <Building2 className="size-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                  <p className="truncate text-sm font-medium text-white">
                    {community.name}
                  </p>
                  <p className="truncate text-xs text-white/70">
                    {community.city} · {community.homes.length} model
                    {community.homes.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="absolute right-2 top-2 flex gap-1">
                  {top10Ids.has(community.id) && (
                    <span className="rounded bg-[#e50914] px-1.5 py-0.5 text-[10px] font-bold text-white">
                      TOP 10
                    </span>
                  )}
                  {featuredIds.has(community.id) && (
                    <span
                      className="flex items-center gap-0.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground"
                      title="Featured on homepage"
                    >
                      <Star className="size-2.5 fill-current" />
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
