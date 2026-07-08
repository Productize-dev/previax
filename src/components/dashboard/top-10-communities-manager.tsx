"use client";

import { useState } from "react";

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
import { useData } from "@/context/data-context";
import { sortTop10Slots } from "@/lib/top-10-communities";

const RANKS = Array.from({ length: 10 }, (_, index) => index + 1);

export function Top10CommunitiesManager() {
  const { communities, top10Communities, setTop10Slot } = useData();
  const [savingRank, setSavingRank] = useState<number | null>(null);

  const slots = sortTop10Slots(top10Communities);
  const slotByRank = new Map(slots.map((slot) => [slot.rank, slot]));

  async function handleAssign(rank: number, communityId: string | null) {
    setSavingRank(rank);
    try {
      await setTop10Slot(rank, communityId);
    } finally {
      setSavingRank(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-2xl">Top 10 Communities</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Assign ranks 1–10 for the badge shown on each community detail page
          (e.g. &quot;#2 in Communities Today&quot;).
        </p>
      </div>

      <div className="space-y-3">
        {RANKS.map((rank) => {
          const current = slotByRank.get(rank);
          const currentCommunity = current
            ? communities.find((community) => community.id === current.communityId)
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
    </div>
  );
}
