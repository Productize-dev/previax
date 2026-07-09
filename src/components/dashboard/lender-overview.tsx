"use client";

import { Building2, Landmark, Plus, Tag } from "lucide-react";

import { StatTile } from "@/components/dashboard/stat-tile";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import type { DashboardTab } from "@/lib/types";

type LenderOverviewProps = {
  onNavigate: (tab: DashboardTab) => void;
};

export function LenderOverview({ onNavigate }: LenderOverviewProps) {
  const { lenders, lenderOffers, catalogCommunities } = useDashboardData();

  const activeOffers = lenderOffers.filter((offer) => offer.isActive);
  const communityIds = new Set(activeOffers.map((o) => o.communityId));

  const communityById = new Map(catalogCommunities.map((c) => [c.id, c]));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile
          label="Lender profiles"
          value={lenders.length}
          icon={Landmark}
          onClick={() => onNavigate("lenders")}
        />
        <StatTile
          label="Active offers"
          value={activeOffers.length}
          icon={Tag}
          onClick={() => onNavigate("lenders")}
          highlight={activeOffers.length > 0}
        />
        <StatTile
          label="Communities covered"
          value={communityIds.size}
          icon={Building2}
        />
      </div>

      {activeOffers.length === 0 ? (
        <button
          type="button"
          onClick={() => onNavigate("lenders")}
          className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-12 text-center transition-colors hover:border-primary/60"
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Plus className="size-6" />
          </span>
          <span className="text-sm font-medium">
            {lenders.length === 0
              ? "Create your lender profile"
              : "Publish your first offer"}
          </span>
          <span className="text-xs text-muted-foreground">
            Offers appear on community detail pages.
          </span>
        </button>
      ) : (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-heading text-lg">Active offers</h3>
            <button
              type="button"
              onClick={() => onNavigate("lenders")}
              className="text-sm text-primary hover:underline"
            >
              Manage →
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeOffers.map((offer) => {
              const community = communityById.get(offer.communityId);
              return (
                <button
                  key={offer.id}
                  type="button"
                  onClick={() => onNavigate("lenders")}
                  className="group relative aspect-video overflow-hidden rounded-xl border border-border text-left transition-colors hover:border-primary/60"
                >
                  {offer.imageUrl || community?.thumbnailUrl ? (
                    <img
                      src={offer.imageUrl || community?.thumbnailUrl}
                      alt=""
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-muted">
                      <Tag className="size-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                    <p className="truncate text-sm font-medium text-white">
                      {offer.title}
                    </p>
                    <p className="truncate text-xs text-white/70">
                      {community
                        ? `${community.name} · ${community.city}`
                        : "Community"}
                    </p>
                  </div>
                  {offer.rate && (
                    <span className="absolute right-2 top-2 rounded bg-[#46d369] px-1.5 py-0.5 text-[10px] font-bold text-black">
                      {offer.rate}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
