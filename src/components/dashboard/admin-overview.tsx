"use client";

import {
  Building2,
  Compass,
  Hammer,
  Home,
  Landmark,
  Sparkles,
  Tag,
  Trophy,
  UserCheck,
} from "lucide-react";

import { StatTile } from "@/components/dashboard/stat-tile";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import type { DashboardTab } from "@/lib/types";

type AdminOverviewProps = {
  onNavigate: (tab: DashboardTab) => void;
  pendingCount?: number;
};

export function AdminOverview({ onNavigate, pendingCount = 0 }: AdminOverviewProps) {
  const {
    communities,
    builders,
    lenders,
    lenderOffers,
    featured,
    featuredCommunities,
    top10Communities,
  } = useDashboardData();

  const totalModels = communities.reduce(
    (sum, community) => sum + community.homes.length,
    0,
  );
  const activeOffers = lenderOffers.filter((o) => o.isActive).length;

  const featuredIds = new Set(featuredCommunities.map((row) => row.communityId));
  const top10Ids = new Set(top10Communities.map((slot) => slot.communityId));

  const recentCommunities = [...communities]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 8);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Pending approvals"
          value={pendingCount}
          icon={UserCheck}
          highlight={pendingCount > 0}
        />
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
          label="Lenders"
          value={lenders.length}
          icon={Landmark}
          onClick={() => onNavigate("lenders")}
        />
        <StatTile
          label="Active offers"
          value={activeOffers}
          icon={Tag}
          onClick={() => onNavigate("lenders")}
        />
        <StatTile
          label="Featured slides"
          value={featured.length}
          icon={Sparkles}
          onClick={() => onNavigate("featured")}
        />
        <StatTile
          label="Top 10 slots"
          value={top10Communities.length}
          icon={Trophy}
          onClick={() => onNavigate("top-10")}
        />
      </div>

      {recentCommunities.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-heading text-lg">Latest communities</h3>
            <button
              type="button"
              onClick={() => onNavigate("communities")}
              className="text-sm text-primary hover:underline"
            >
              View all →
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {recentCommunities.map((community) => (
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
                    <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                      ★
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-3 font-heading text-lg">Curation shortcuts</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ShortcutTile
            icon={Sparkles}
            title="Featured Carousel"
            count={featured.length}
            onClick={() => onNavigate("featured")}
          />
          <ShortcutTile
            icon={Compass}
            title="Featured Communities"
            count={featuredCommunities.length}
            onClick={() => onNavigate("featured-communities")}
          />
          <ShortcutTile
            icon={Trophy}
            title="Top 10 Communities"
            count={top10Communities.length}
            onClick={() => onNavigate("top-10")}
          />
        </div>
      </section>
    </div>
  );
}

function ShortcutTile({
  icon: Icon,
  title,
  count,
  onClick,
}: {
  icon: typeof Sparkles;
  title: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/60"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">
          {count} item{count === 1 ? "" : "s"}
        </span>
      </span>
      <span className="text-muted-foreground">→</span>
    </button>
  );
}
