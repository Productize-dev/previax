"use client";

import { RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { Top10Skeleton } from "@/components/dashboard/dashboard-skeleton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { toastError, toastSuccess } from "@/lib/toast";
import { sortTop10Slots } from "@/lib/top-10-communities";
import type { Top10CommunitySlot, Top10Period } from "@/lib/types";

const RANKS = Array.from({ length: 10 }, (_, index) => index + 1);

const PERIOD_OPTIONS: { value: Top10Period; label: string }[] = [
  { value: "all-time", label: "All time" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
];

export function Top10CommunitiesManager() {
  const {
    communities,
    fetchTop10Communities,
    setTop10Slot,
    computeTop10,
  } = useDashboardData();
  const [period, setPeriod] = useState<Top10Period>("all-time");
  const [slots, setSlots] = useState<Top10CommunitySlot[]>([]);
  const [savingRank, setSavingRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [recomputing, setRecomputing] = useState(false);
  const [clearTarget, setClearTarget] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
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
      toastSuccess(
        communityId ? `Rank #${rank} updated` : `Rank #${rank} cleared`,
      );
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Could not save rank");
    } finally {
      setSavingRank(null);
    }
  }

  async function handleRecompute() {
    setRecomputing(true);
    try {
      const inserted = await computeTop10(period);
      const updated = await fetchTop10Communities(period);
      setSlots(sortTop10Slots(updated));
      toastSuccess(
        inserted > 0
          ? `Recomputed — ${inserted} auto slot${inserted === 1 ? "" : "s"} filled`
          : "Recomputed — no new auto slots (manual overrides kept)",
      );
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Recompute failed");
    } finally {
      setRecomputing(false);
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
            Auto-ranked from views, saves, and offer clicks. Manual picks override
            auto slots until cleared.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full max-w-xs space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Period
            </p>
            <Select
              value={period}
              onValueChange={(value) => {
                setLoading(true);
                setPeriod(value as Top10Period);
              }}
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
          <Button
            type="button"
            variant="outline"
            disabled={recomputing}
            onClick={() => void handleRecompute()}
            className="gap-2"
          >
            <RefreshCw
              className={`size-4 ${recomputing ? "animate-spin" : ""}`}
            />
            Recompute now
          </Button>
        </div>
      </div>

      {loading ? (
        <Top10Skeleton />
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Editing <strong className="text-foreground">{periodLabel}</strong>{" "}
            rankings ·{" "}
            <span className="inline-flex items-center gap-1">
              <Sparkles className="size-3" /> Auto = calculated from signals
            </span>
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
                      <CardTitle className="flex items-center gap-2 text-base">
                        Rank #{rank}
                        {current && (
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                              current.isAuto
                                ? "bg-muted text-muted-foreground"
                                : "bg-primary/15 text-primary"
                            }`}
                          >
                            {current.isAuto ? "Auto" : "Manual"}
                          </span>
                        )}
                      </CardTitle>
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
                        onClick={() => setClearTarget(rank)}
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

      <Dialog
        open={clearTarget !== null}
        onOpenChange={(open) => !open && setClearTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear rank #{clearTarget}?</DialogTitle>
            <DialogDescription>
              This removes the manual assignment. Auto recompute can fill the slot
              again on the next cron run.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setClearTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (clearTarget !== null) {
                  void handleAssign(clearTarget, null);
                  setClearTarget(null);
                }
              }}
            >
              Clear slot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
