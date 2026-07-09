"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import type { LenderOffer } from "@/lib/types";

type LenderOfferListProps = {
  onEdit: (offer: LenderOffer) => void;
};

export function LenderOfferList({ onEdit }: LenderOfferListProps) {
  const {
    lenderOffers,
    lenders,
    catalogCommunities,
    deleteLenderOffer,
    updateLenderOffer,
    isAdmin,
  } = useDashboardData();
  const [busyId, setBusyId] = useState<string | null>(null);

  const lenderName = (id: string) =>
    lenders.find((l) => l.id === id)?.name ?? "Unknown lender";
  const communityLabel = (id: string) => {
    const c = catalogCommunities.find((item) => item.id === id);
    return c ? `${c.name} — ${c.city}` : "Unknown community";
  };

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      await deleteLenderOffer(id);
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleActive(offer: LenderOffer) {
    setBusyId(offer.id);
    try {
      await updateLenderOffer(offer.id, { isActive: !offer.isActive });
    } finally {
      setBusyId(null);
    }
  }

  if (lenderOffers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl">Your offers</CardTitle>
          <CardDescription>No financing offers yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl">
          {isAdmin ? "All offers" : "Your offers"}
        </CardTitle>
        <CardDescription>
          {lenderOffers.length} offer{lenderOffers.length === 1 ? "" : "s"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {lenderOffers.map((offer) => (
          <div
            key={offer.id}
            className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <p className="font-medium">{offer.title}</p>
              <p className="text-sm text-muted-foreground">
                {isAdmin && (
                  <span className="mr-2">{lenderName(offer.lenderId)} ·</span>
                )}
                {communityLabel(offer.communityId)}
              </p>
              {(offer.rate || offer.terms) && (
                <p className="text-sm text-primary">
                  {[offer.rate, offer.terms].filter(Boolean).join(" · ")}
                </p>
              )}
              <p className="text-sm text-muted-foreground line-clamp-2">
                {offer.description}
              </p>
              {!offer.isActive && (
                <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  Inactive
                </span>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busyId === offer.id}
                onClick={() => void handleToggleActive(offer)}
              >
                {offer.isActive ? "Deactivate" : "Activate"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={busyId === offer.id}
                onClick={() => onEdit(offer)}
                aria-label="Edit offer"
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={busyId === offer.id}
                onClick={() => void handleDelete(offer.id)}
                aria-label="Delete offer"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}