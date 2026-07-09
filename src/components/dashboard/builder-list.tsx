"use client";

import { Pencil, Trash2 } from "lucide-react";
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
import { communityHasBuilder } from "@/lib/community-builders";
import type { Builder } from "@/lib/types";
import { cn } from "@/lib/utils";

type BuilderListProps = {
  selectedBuilderId: string | null;
  onSelect: (builderId: string) => void;
  onEdit: (builder: Builder) => void;
};

export function BuilderList({
  selectedBuilderId,
  onSelect,
  onEdit,
}: BuilderListProps) {
  const { builders, communities, deleteBuilder } = useDashboardData();
  const [deleteTarget, setDeleteTarget] = useState<Builder | null>(null);

  async function confirmDelete() {
    if (!deleteTarget) return;
    await deleteBuilder(deleteTarget.id);
    if (selectedBuilderId === deleteTarget.id) {
      onSelect("");
    }
    setDeleteTarget(null);
  }

  if (builders.length === 0) {
    return (
      <p className="text-muted-foreground">
        No builders yet. Add one to start organizing communities and models.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <h3 className="font-heading text-lg">All builders</h3>
        {builders.map((builder) => {
          const communityCount = communities.filter((community) =>
            communityHasBuilder(community, builder.id),
          ).length;
          const selected = selectedBuilderId === builder.id;

          return (
            <Card
              key={builder.id}
              className={cn(
                "cursor-pointer transition-colors",
                selected && "border-primary",
              )}
              onClick={() => onSelect(builder.id)}
            >
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div className="flex min-w-0 gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-sm font-semibold text-muted-foreground">
                    {builder.logoUrl ? (
                      <img
                        src={builder.logoUrl}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      builder.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base">{builder.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {communityCount} communit
                      {communityCount === 1 ? "y" : "ies"}
                    </p>
                    {builder.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {builder.description}
                      </p>
                    )}
                  </div>
                </div>
                <div
                  className="flex shrink-0 gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onEdit(builder)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setDeleteTarget(builder)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
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
            <DialogTitle>Delete builder?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget?.name}</strong>? Linked communities will
              remain but lose their builder association.
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
