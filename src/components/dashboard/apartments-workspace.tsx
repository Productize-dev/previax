"use client";

import { useState } from "react";

import { ApartmentCommunityForm } from "@/components/dashboard/apartment-community-form";
import { ApartmentCommunityList } from "@/components/dashboard/apartment-community-list";
import { ApartmentFloorPlanForm } from "@/components/dashboard/apartment-floor-plan-form";
import type { ApartmentCommunity, ApartmentFloorPlan } from "@/lib/types";

export function ApartmentsWorkspace() {
  const [editingCommunity, setEditingCommunity] =
    useState<ApartmentCommunity | null>(null);
  const [addingPlanForId, setAddingPlanForId] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<ApartmentFloorPlan | null>(
    null,
  );
  const [editingPlanCommunityId, setEditingPlanCommunityId] = useState<
    string | null
  >(null);

  const showPlanForm =
    addingPlanForId !== null ||
    (editingPlan !== null && editingPlanCommunityId !== null);

  function clearPlanForm() {
    setAddingPlanForId(null);
    setEditingPlan(null);
    setEditingPlanCommunityId(null);
  }

  return (
    <div className="space-y-10">
      <div>
        <h2 className="font-heading text-2xl">Apartments</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Rentals for relocators who need a place while they shop for a home.
          Linked on the public site under Rent.
        </p>
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <ApartmentCommunityForm
          key={editingCommunity?.id ?? "new-apartment"}
          editingItem={editingCommunity}
          onEditComplete={() => setEditingCommunity(null)}
        />
        <ApartmentCommunityList
          onEdit={setEditingCommunity}
          onAddFloorPlan={(id) => {
            setAddingPlanForId(id);
            setEditingPlan(null);
            setEditingPlanCommunityId(null);
          }}
          onEditFloorPlan={(communityId, plan) => {
            setEditingPlanCommunityId(communityId);
            setEditingPlan(plan);
            setAddingPlanForId(null);
          }}
        />
      </div>

      {showPlanForm && (
        <div className="border-t border-border pt-10">
          <ApartmentFloorPlanForm
            key={
              editingPlan?.id ??
              `new-plan-${addingPlanForId ?? editingPlanCommunityId}`
            }
            apartmentCommunityId={
              addingPlanForId ?? editingPlanCommunityId ?? ""
            }
            editingPlan={editingPlan}
            onEditComplete={clearPlanForm}
          />
        </div>
      )}
    </div>
  );
}
