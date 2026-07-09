"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Compass,
  Eye,
  Hammer,
  Heart,
  Home,
  Landmark,
  Sparkles,
  Tag,
  Trophy,
  UserCheck,
} from "lucide-react";

import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { MiniBarChart } from "@/components/dashboard/mini-bar-chart";
import { StatTile } from "@/components/dashboard/stat-tile";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import type { ActivityEvent, DashboardTab } from "@/lib/types";

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
    fetchActivityEvents,
  } = useDashboardData();

  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [weekCutoff] = useState(
    () => Date.now() - 7 * 24 * 60 * 60 * 1000,
  );

  useEffect(() => {
    let cancelled = false;
    void fetchActivityEvents(50).then((data) => {
      if (!cancelled) {
        setEvents(data);
        setEventsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [fetchActivityEvents]);

  const totalModels = communities.reduce(
    (sum, community) => sum + community.homes.length,
    0,
  );
  const activeOffers = lenderOffers.filter((o) => o.isActive).length;
  const totalViews = communities.reduce((s, c) => s + (c.viewCount ?? 0), 0);
  const totalSaves = communities.reduce((s, c) => s + (c.saveCount ?? 0), 0);

  const featuredIds = new Set(featuredCommunities.map((row) => row.communityId));
  const top10Ids = new Set(top10Communities.map((slot) => slot.communityId));

  const weeklyViews = useMemo(() => {
    const counts = new Map<string, number>();
    for (const event of events) {
      if (event.type !== "community_viewed") continue;
      if (Date.parse(event.createdAt) < weekCutoff) continue;
      counts.set(event.entityId, (counts.get(event.entityId) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([id, value]) => {
        const c = communities.find((item) => item.id === id);
        return { label: c?.name ?? id.slice(0, 10), value };
      })
      .sort((a, b) => b.value - a.value);
  }, [events, communities, weekCutoff]);

  const topViewedFallback = useMemo(
    () =>
      [...communities]
        .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
        .slice(0, 5)
        .map((c) => ({ label: c.name, value: c.viewCount ?? 0 })),
    [communities],
  );

  const chartData = weeklyViews.length > 0 ? weeklyViews : topViewedFallback;

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
          label="Active communities"
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
          label="Active offers"
          value={activeOffers}
          icon={Tag}
          onClick={() => onNavigate("lenders")}
        />
        <StatTile label="Total views" value={totalViews} icon={Eye} />
        <StatTile label="Total saves" value={totalSaves} icon={Heart} />
        <StatTile
          label="Builders"
          value={builders.length}
          icon={Hammer}
          onClick={() => onNavigate("builders")}
        />
        <StatTile
          label="Lenders"
          value={lenders.length}
          icon={Landmark}
          onClick={() => onNavigate("lenders")}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card/50 p-5">
          <h3 className="font-heading text-lg">
            {weeklyViews.length > 0 ? "Most viewed this week" : "Most viewed (all time)"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Engagement from community page views.
          </p>
          <div className="mt-4">
            <MiniBarChart items={chartData} />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card/50 p-5">
          <h3 className="font-heading text-lg">Recent activity</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            New communities, published offers, and approved accounts.
          </p>
          <div className="mt-4">
            <ActivityFeed
              events={events}
              communities={communities}
              loading={eventsLoading}
            />
          </div>
        </section>
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
                    {(community.viewCount ?? 0) > 0 &&
                      ` · ${community.viewCount} views`}
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
