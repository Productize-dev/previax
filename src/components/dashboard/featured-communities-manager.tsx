"use client";

import {
  ArrowDown,
  ArrowUp,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { useData } from "@/context/data-context";
import type { FeaturedCommunityRow } from "@/lib/types";

export function FeaturedCommunitiesManager() {
  const {
    communities,
    featuredCommunities,
    addFeaturedCommunity,
    removeFeaturedCommunity,
    reorderFeaturedCommunities,
  } = useData();
  const [selectedCommunityId, setSelectedCommunityId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<FeaturedCommunityRow | null>(
    null,
  );
  const [adding, setAdding] = useState(false);

  const rows = [...featuredCommunities].sort((a, b) => a.order - b.order);
  const usedIds = new Set(rows.map((row) => row.communityId));
  const availableCommunities = communities.filter((c) => !usedIds.has(c.id));

  async function handleAdd() {
    if (!selectedCommunityId) return;
    setAdding(true);
    try {
      await addFeaturedCommunity(selectedCommunityId);
      setSelectedCommunityId("");
    } finally {
      setAdding(false);
    }
  }

  async function moveRow(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= rows.length) return;
    const ids = rows.map((row) => row.id);
    [ids[index], ids[newIndex]] = [ids[newIndex], ids[index]];
    await reorderFeaturedCommunities(ids);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await removeFeaturedCommunity(deleteTarget.id);
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-2xl">Featured Communities</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Curate the row that appears directly below Trending Now on the
          homepage. Later this will personalize from buyer profiles — for now
          you choose which communities appear and in what order.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add community</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-2">
            <Select
              value={selectedCommunityId}
              onValueChange={(value) => setSelectedCommunityId(value ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a community" />
              </SelectTrigger>
              <SelectContent>
                {availableCommunities.map((community) => (
                  <SelectItem key={community.id} value={community.id}>
                    {community.name} — {community.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            onClick={handleAdd}
            disabled={!selectedCommunityId || adding}
          >
            <Plus className="size-4" />
            Add to row
          </Button>
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <p className="text-muted-foreground">
          No communities in this row yet. Add communities above to populate
          Featured Communities on the homepage.
        </p>
      ) : (
        <div className="space-y-3">
          <h3 className="font-heading text-lg">
            Homepage order ({rows.length} communit
            {rows.length === 1 ? "y" : "ies"})
          </h3>
          {rows.map((row, index) => {
            const community = communities.find((c) => c.id === row.communityId);
            if (!community) return null;

            return (
              <Card key={row.id}>
                <CardHeader className="flex-row items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={index === 0}
                        onClick={() => moveRow(index, -1)}
                      >
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={index === rows.length - 1}
                        onClick={() => moveRow(index, 1)}
                      >
                        <ArrowDown className="size-4" />
                      </Button>
                    </div>
                    <div className="flex gap-3">
                      {community.thumbnailUrl && (
                        <div className="size-16 shrink-0 overflow-hidden rounded-md border border-border">
                          <img
                            src={community.thumbnailUrl}
                            alt=""
                            className="size-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-base">
                          {index + 1}. {community.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {community.city}
                        </p>
                        {community.mainHighlight && (
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {community.mainHighlight}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setDeleteTarget(row)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove from Featured Communities?</DialogTitle>
            <DialogDescription>
              This community will be removed from the homepage row. The
              community itself won&apos;t be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
