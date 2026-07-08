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
import { useData } from "@/context/data-context";
import type { Lender } from "@/lib/types";

function lenderInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

type LenderListProps = {
  onEdit: (item: Lender) => void;
};

export function LenderList({ onEdit }: LenderListProps) {
  const { lenders, deleteLender, reorderLenders } = useData();
  const [deleteTarget, setDeleteTarget] = useState<Lender | null>(null);

  const items = [...lenders].sort((a, b) => a.order - b.order);

  async function moveItem(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;
    const ids = items.map((item) => item.id);
    [ids[index], ids[newIndex]] = [ids[newIndex], ids[index]];
    await reorderLenders(ids);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await deleteLender(deleteTarget.id);
    setDeleteTarget(null);
  }

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground">
        No lenders yet. Add one to populate the homepage lenders row.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <h3 className="font-heading text-lg">
          Homepage order ({items.length} lender{items.length !== 1 ? "s" : ""})
        </h3>
        {items.map((item, index) => (
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
                <div className="flex gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-medium text-muted-foreground">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      lenderInitials(item.name)
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      {index + 1}. {item.name}
                    </CardTitle>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
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
            {item.imageUrl && (
              <CardContent className="pt-0">
                <div className="size-16 overflow-hidden rounded-full border border-border">
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="size-full object-cover"
                  />
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove lender?</DialogTitle>
            <DialogDescription>
              &ldquo;{deleteTarget?.name}&rdquo; will be removed from the
              homepage lenders row.
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
