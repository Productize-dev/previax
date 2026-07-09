"use client";

import { useMemo } from "react";

import { ActivityFeedSkeleton } from "@/components/dashboard/dashboard-skeleton";
import {
  activityEntityHint,
  formatActivityTime,
  getActivityLabel,
} from "@/lib/activity-labels";
import type { ActivityEvent, Community } from "@/lib/types";

type ActivityFeedProps = {
  events: ActivityEvent[];
  communities: Community[];
  loading?: boolean;
};

const LIFECYCLE_TYPES = new Set([
  "community_created",
  "offer_published",
  "account_approved",
]);

export function ActivityFeed({ events, communities, loading }: ActivityFeedProps) {
  const communityById = useMemo(
    () => new Map(communities.map((c) => [c.id, c])),
    [communities],
  );

  const feed = events.filter((e) => LIFECYCLE_TYPES.has(e.type));

  if (loading) return <ActivityFeedSkeleton />;

  if (feed.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No recent activity yet. Events appear when communities, offers, or
        accounts are created.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {feed.map((event) => {
        const community = communityById.get(event.entityId);
        return (
          <li
            key={event.id}
            className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card/50 px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">{getActivityLabel(event.type)}</p>
              <p className="truncate text-xs text-muted-foreground">
                {activityEntityHint(event, community?.name)}
              </p>
            </div>
            <time className="shrink-0 text-xs text-muted-foreground">
              {formatActivityTime(event.createdAt)}
            </time>
          </li>
        );
      })}
    </ul>
  );
}
