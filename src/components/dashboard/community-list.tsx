"use client";

import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
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
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { getPriceRange } from "@/lib/community-utils";
import { getHomeModelName } from "@/lib/home-model";
import {
  communityHasBuilder,
  getCommunityBuilderDisplay,
} from "@/lib/community-builders";
import { getCommunityTagLabel } from "@/lib/tag-labels";
import type { Community, Home } from "@/lib/types";

type CommunityListProps = {
  filterBuilderId?: string;
  showBuilder?: boolean;
  onEditCommunity: (community: Community) => void;
  onEditHome?: (communityId: string, home: Home) => void;
  onAddHome?: (communityId: string) => void;
};

export function CommunityList({
  filterBuilderId,
  showBuilder = false,
  onEditCommunity,
  onEditHome,
  onAddHome,
}: CommunityListProps) {
  const { communities, builders, customCommunityTagLabels, deleteCommunity, deleteHome } =
    useDashboardData();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "community" | "home";
    communityId: string;
    homeId?: string;
    name: string;
  } | null>(null);

  const items = filterBuilderId
    ? communities.filter((community) =>
        communityHasBuilder(community, filterBuilderId),
      )
    : communities;

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.type === "community") {
      await deleteCommunity(deleteTarget.communityId);
    } else if (deleteTarget.homeId) {
      await deleteHome(deleteTarget.communityId, deleteTarget.homeId);
    }
    setDeleteTarget(null);
  }

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground">
        {filterBuilderId
          ? "No communities for this builder yet. Add one using the form."
          : "No communities yet. Add one using the form."}
      </p>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <h2 className="font-heading text-xl">
          {filterBuilderId ? "Communities" : "All Communities"}
        </h2>
        {items.map((community) => {
          const isOpen = expanded.has(community.id);
          const priceRange = getPriceRange(community);
          const builderName = getCommunityBuilderDisplay(community, builders);

          return (
            <Card key={community.id}>
              <CardHeader className="flex-row items-center justify-between gap-4">
                <button
                  type="button"
                  className="flex flex-1 items-center gap-2 text-left"
                  onClick={() => toggleExpanded(community.id)}
                >
                  {isOpen ? (
                    <ChevronDown className="size-4 shrink-0" />
                  ) : (
                    <ChevronRight className="size-4 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <CardTitle>{community.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {community.city}
                      {showBuilder ? ` · ${builderName}` : ""}
                      {community.isMultiBuilder && (
                        <span className="text-primary"> · Multi-builder</span>
                      )}
                      {priceRange ? ` · ${priceRange.label}` : ""}
                      {" · "}
                      {community.homes.length} model
                      {community.homes.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </button>
                <div className="flex shrink-0 gap-1">
                  {onAddHome && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onAddHome(community.id)}
                      aria-label="Add model"
                    >
                      <Plus className="size-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onEditCommunity(community)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() =>
                      setDeleteTarget({
                        type: "community",
                        communityId: community.id,
                        name: community.name,
                      })
                    }
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>

              {community.mainHighlight && !isOpen && (
                <CardContent className="border-t pt-4">
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {community.mainHighlight}
                  </p>
                  {community.tags && community.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {community.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                        >
                          {getCommunityTagLabel(tag, customCommunityTagLabels)}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}

              {isOpen && (
                <CardContent className="space-y-2 border-t pt-4">
                  {community.homes.length > 0 ? (
                    community.homes.map((home) => (
                      <div
                        key={home.id}
                        className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {getHomeModelName(home)}
                          </p>
                          {home.description && (
                            <p className="line-clamp-2 text-xs text-muted-foreground">
                              {home.description}
                            </p>
                          )}
                          {home.youtubeUrl && (
                            <p className="truncate text-xs text-muted-foreground">
                              Video linked
                            </p>
                          )}
                        </div>
                        {onEditHome && (
                          <div className="flex shrink-0 gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => onEditHome(community.id, home)}
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() =>
                                setDeleteTarget({
                                  type: "home",
                                  communityId: community.id,
                                  homeId: home.id,
                                  name: getHomeModelName(home),
                                })
                              }
                            >
                              <Trash2 className="size-3.5 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No models yet.
                      {onAddHome && " Use + to add a home model."}
                    </p>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget?.name}</strong>? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
