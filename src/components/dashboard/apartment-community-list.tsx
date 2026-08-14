"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
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
import {
  formatRent,
  getAvailableFloorPlanCount,
  getRentRange,
} from "@/lib/apartment-utils";
import { toastError, toastSuccess } from "@/lib/toast";
import type { ApartmentCommunity, ApartmentFloorPlan } from "@/lib/types";

type ApartmentCommunityListProps = {
  onEdit: (item: ApartmentCommunity) => void;
  onAddFloorPlan: (communityId: string) => void;
  onEditFloorPlan: (communityId: string, plan: ApartmentFloorPlan) => void;
};

export function ApartmentCommunityList({
  onEdit,
  onAddFloorPlan,
  onEditFloorPlan,
}: ApartmentCommunityListProps) {
  const { apartmentCommunities, deleteApartmentCommunity, deleteFloorPlan } =
    useDashboardData();
  const [deleteTarget, setDeleteTarget] = useState<ApartmentCommunity | null>(
    null,
  );
  const [deletePlanTarget, setDeletePlanTarget] = useState<{
    communityId: string;
    plan: ApartmentFloorPlan;
  } | null>(null);

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteApartmentCommunity(deleteTarget.id);
      toastSuccess("Apartment community deleted.");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleteTarget(null);
    }
  }

  async function confirmDeletePlan() {
    if (!deletePlanTarget) return;
    try {
      await deleteFloorPlan(
        deletePlanTarget.communityId,
        deletePlanTarget.plan.id,
      );
      toastSuccess("Floor plan deleted.");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletePlanTarget(null);
    }
  }

  if (apartmentCommunities.length === 0) {
    return (
      <p className="text-muted-foreground">
        No apartment communities yet. Add one for relocators who need a rental
        before buying.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <h3 className="font-heading text-lg">
          Apartment communities ({apartmentCommunities.length})
        </h3>
        {apartmentCommunities.map((item) => {
          const rentRange = getRentRange(item);
          const available = getAvailableFloorPlanCount(item);
          return (
            <Card key={item.id}>
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div className="min-w-0">
                  <CardTitle className="font-heading text-lg">
                    {item.name}
                    {item.isHidden ? (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        Hidden
                      </span>
                    ) : null}
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.city}, NC
                    {rentRange ? ` · ${rentRange.label}` : ""}
                    {available > 0
                      ? ` · ${available} available plan${available === 1 ? "" : "s"}`
                      : ""}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onEdit(item)}
                    aria-label="Edit"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setDeleteTarget(item)}
                    aria-label="Delete"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">Floor plans</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAddFloorPlan(item.id)}
                  >
                    <Plus className="mr-1 size-3.5" />
                    Add plan
                  </Button>
                </div>
                {item.floorPlans.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No floor plans yet.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {item.floorPlans.map((plan) => (
                      <li
                        key={plan.id}
                        className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {plan.name || "Untitled plan"}
                          </p>
                          <p className="text-muted-foreground">
                            {plan.bedrooms} bd · {plan.bathrooms} ba ·{" "}
                            {plan.sqft.toLocaleString()} sqft
                            {plan.rent > 0 ? ` · ${formatRent(plan.rent)}` : ""}
                            {plan.status ? ` · ${plan.status}` : ""}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => onEditFloorPlan(item.id, plan)}
                            aria-label="Edit floor plan"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() =>
                              setDeletePlanTarget({
                                communityId: item.id,
                                plan,
                              })
                            }
                            aria-label="Delete floor plan"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
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
            <DialogTitle>Delete apartment community?</DialogTitle>
            <DialogDescription>
              This removes {deleteTarget?.name} and all of its floor plans.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void confirmDelete()}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deletePlanTarget !== null}
        onOpenChange={(open) => !open && setDeletePlanTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete floor plan?</DialogTitle>
            <DialogDescription>
              This removes {deletePlanTarget?.plan.name || "this floor plan"}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletePlanTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void confirmDeletePlan()}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
