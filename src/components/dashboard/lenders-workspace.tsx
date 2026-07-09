"use client";

import { useState } from "react";

import { LenderForm } from "@/components/dashboard/lender-form";
import { LenderList } from "@/components/dashboard/lender-list";
import { LenderOfferForm } from "@/components/dashboard/lender-offer-form";
import { LenderOfferList } from "@/components/dashboard/lender-offer-list";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import type { Lender, LenderOffer } from "@/lib/types";

export function LendersWorkspace() {
  const { isLender, isAdmin } = useDashboardData();
  const [editingLender, setEditingLender] = useState<Lender | null>(null);
  const [editingOffer, setEditingOffer] = useState<LenderOffer | null>(null);

  const showOffers = isLender || isAdmin;

  return (
    <div className="space-y-10">
      <div>
        <h2 className="font-heading text-2xl">Lenders</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isLender
            ? "Manage your lender profile and publish financing offers for communities."
            : "Manage lender profiles and all financing offers across the site."}
        </p>
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <LenderForm
          key={editingLender?.id ?? "new-lender"}
          editingItem={editingLender}
          onEditComplete={() => setEditingLender(null)}
        />
        <LenderList onEdit={setEditingLender} />
      </div>

      {showOffers && (
        <div className="space-y-6 border-t border-border pt-10">
          <div>
            <h3 className="font-heading text-xl">Financing offers</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Offers appear on community detail pages under &quot;Financing
              offers&quot;.
            </p>
          </div>
          <div className="grid gap-8 xl:grid-cols-2">
            <LenderOfferForm
              key={editingOffer?.id ?? "new-offer"}
              editingItem={editingOffer}
              onEditComplete={() => setEditingOffer(null)}
            />
            <LenderOfferList onEdit={setEditingOffer} />
          </div>
        </div>
      )}
    </div>
  );
}
