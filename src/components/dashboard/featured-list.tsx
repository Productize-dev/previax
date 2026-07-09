"use client";

import {
  ArrowDown,
  ArrowUp,
  Pencil,
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
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { extractYouTubeId } from "@/lib/youtube";
import type { FeaturedItem } from "@/lib/types";

type FeaturedListProps = {
  onEdit: (item: FeaturedItem) => void;
};

export function FeaturedList({ onEdit }: FeaturedListProps) {
  const { featured, deleteFeatured, reorderFeatured } = useDashboardData();
  const [deleteTarget, setDeleteTarget] = useState<FeaturedItem | null>(null);

  const items = [...featured].sort((a, b) => a.order - b.order);

  async function moveItem(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;
    const ids = items.map((f) => f.id);
    [ids[index], ids[newIndex]] = [ids[newIndex], ids[index]];
    await reorderFeatured(ids);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await deleteFeatured(deleteTarget.id);
    setDeleteTarget(null);
  }

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground">
        No featured slides yet. Add one to populate the homepage carousel.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <h3 className="font-heading text-lg">
          Carousel order ({items.length} slides)
        </h3>
        {items.map((item, index) => {
          const videoId = extractYouTubeId(item.youtubeUrl);
          return (
            <Card key={item.id}>
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={index === 0}
                      onClick={() => moveItem(index, -1)}
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={index === items.length - 1}
                      onClick={() => moveItem(index, 1)}
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      {index + 1}. {item.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {item.subtitle}
                    </p>
                    {videoId && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        YouTube: {videoId}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onEdit(item)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setDeleteTarget(item)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              {videoId && (
                <CardContent className="pt-0">
                  <div className="aspect-video overflow-hidden rounded-lg">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                      title={item.title}
                      className="h-full w-full"
                      loading="lazy"
                    />
                  </div>
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
            <DialogTitle>Remove from carousel?</DialogTitle>
            <DialogDescription>
              &ldquo;{deleteTarget?.title}&rdquo; will be removed from the
              homepage hero. The community itself won&apos;t be deleted.
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
    </>
  );
}
