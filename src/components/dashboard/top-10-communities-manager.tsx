"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { sortTop10Slots } from "@/lib/top-10-communities";
import type { Top10CommunitySlot, Top10Period } from "@/lib/types";

const RANKS = Array.from({ length: 10 }, (_, index) => index + 1);

const PERIOD_OPTIONS: { value: Top10Period; label: string }[] = [
  { value: "all-time", label: "All time" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
];

export function Top10CommunitiesManager() {
  const { communities, fetchTop10Communities, setTop10Slot } =
    useDashboardData();
  const [period, setPeriod] = useState<Top10Period>("all-time");
  const [slots, setSlots] = useState<Top10CommunitySlot[]>([]);
  const [savingRank, setSavingRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchTop10Communities(period).then((next) => {
      if (!cancelled) {
        setSlots(sortTop10Slots(next));
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [period, fetchTop10Communities]);

  const slotByRank = new Map(slots.map((slot) => [slot.rank, slot]));

  async function handleAssign(rank: number, communityId: string | null) {
    setSavingRank(rank);
    try {
      const updated = await setTop10Slot(rank, communityId, period);
      setSlots(sortTop10Slots(updated));
    } finally {
      setSavingRank(null);
    }
  }

  const periodLabel =
    PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? period;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-2xl">Top 10 Communities</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Assign ranks 1–10 for the badge on each community detail page
            (e.g. &quot;#2 in Communities Today&quot;).
          </p>
        </div>
        <div className="w-full max-w-xs space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Period
          </p>
          <Select
            value={period}
            onValueChange={(value) => setPeriod(value as Top10Period)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading rankings…</p>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Editing <strong className="text-foreground">{periodLabel}</strong>{" "}
            rankings
          </p>
          {RANKS.map((rank) => {
            const current = slotByRank.get(rank);
            const currentCommunity = current
              ? communities.find(
                  (community) => community.id === current.communityId,
                )
              : undefined;
            const usedElsewhere = new Set(
              slots
                .filter((slot) => slot.rank !== rank)
                .map((slot) => slot.communityId),
            );

            return (
              <Card key={rank}>
                <CardHeader className="flex-row items-center justify-between gap-4 py-4">
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center bg-[#e50914] text-xs font-black leading-none text-white">
                      TOP
                      <br />
                      {rank}
                    </span>
                    <div className="min-w-0">
                      <CardTitle className="text-base">Rank #{rank}</CardTitle>
                      <CardDescription className="truncate">
                        {currentCommunity
                          ? `${currentCommunity.name} — ${currentCommunity.city}`
                          : "No community assigned"}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex w-full max-w-sm items-center gap-2 sm:w-auto">
                    <Select
                      value={current?.communityId ?? ""}
                      onValueChange={(value) =>
                        void handleAssign(rank, value || null)
                      }
                      disabled={savingRank === rank}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select community" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {communities.map((community) => (
                          <SelectItem
                            key={community.id}
                            value={community.id}
                            disabled={usedElsewhere.has(community.id)}
                          >
                            {community.name} — {community.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {current && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={savingRank === rank}
                        onClick={() => void handleAssign(rank, null)}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </CardHeader>
                {currentCommunity?.thumbnailUrl && (
                  <CardContent className="pt-0">
                    <div className="h-20 w-36 overflow-hidden rounded-md border border-border">
                      <img
                        src={currentCommunity.thumbnailUrl}
                        alt=""
                        className="size-full object-cover"
                      />
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
