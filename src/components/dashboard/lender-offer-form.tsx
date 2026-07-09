"use client";

import { useState } from "react";

import { ImageInput } from "@/components/dashboard/image-input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import type { LenderOffer, LenderOfferInput } from "@/lib/types";

const emptyForm = (
  lenderId: string,
): LenderOfferInput => ({
  lenderId,
  communityId: "",
  title: "",
  rate: "",
  terms: "",
  description: "",
  imageUrl: "",
  validUntil: "",
});

type LenderOfferFormProps = {
  editingItem: LenderOffer | null;
  onEditComplete: () => void;
};

export function LenderOfferForm({
  editingItem,
  onEditComplete,
}: LenderOfferFormProps) {
  const { lenders, catalogCommunities, addLenderOffer, updateLenderOffer } =
    useDashboardData();
  const defaultLenderId = lenders[0]?.id ?? "";

  const [form, setForm] = useState<LenderOfferInput>(
    editingItem
      ? {
          lenderId: editingItem.lenderId,
          communityId: editingItem.communityId,
          title: editingItem.title,
          rate: editingItem.rate ?? "",
          terms: editingItem.terms ?? "",
          description: editingItem.description,
          imageUrl: editingItem.imageUrl ?? "",
          validUntil: editingItem.validUntil ?? "",
          isActive: editingItem.isActive,
        }
      : emptyForm(defaultLenderId),
  );
  const [submitting, setSubmitting] = useState(false);

  const isEditing = editingItem !== null;

  function updateField<K extends keyof LenderOfferInput>(
    field: K,
    value: LenderOfferInput[K],
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !form.lenderId ||
      !form.communityId ||
      !form.title.trim() ||
      !form.description.trim()
    ) {
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing) {
        await updateLenderOffer(editingItem.id, form);
        onEditComplete();
      } else {
        await addLenderOffer(form);
      }
      setForm(emptyForm(lenders[0]?.id ?? ""));
    } finally {
      setSubmitting(false);
    }
  }

  if (lenders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl">Financing offers</CardTitle>
          <CardDescription>
            Create your lender profile first, then you can publish offers for
            specific communities.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl">
          {isEditing ? "Edit offer" : "New financing offer"}
        </CardTitle>
        <CardDescription>
          Offers appear on the community detail page under &quot;Financing
          offers&quot;.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {lenders.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="offer-lender">Lender profile</Label>
              <Select
                value={form.lenderId}
                onValueChange={(value) =>
                  value && updateField("lenderId", value)
                }
              >
                <SelectTrigger id="offer-lender">
                  <SelectValue placeholder="Select lender" />
                </SelectTrigger>
                <SelectContent>
                  {lenders.map((lender) => (
                    <SelectItem key={lender.id} value={lender.id}>
                      {lender.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="offer-community">Community</Label>
            <Select
              value={form.communityId}
              onValueChange={(value) =>
                value && updateField("communityId", value)
              }
            >
              <SelectTrigger id="offer-community">
                <SelectValue placeholder="Select community" />
              </SelectTrigger>
              <SelectContent>
                {catalogCommunities.map((community) => (
                  <SelectItem key={community.id} value={community.id}>
                    {community.name} — {community.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="offer-title">Title</Label>
            <Input
              id="offer-title"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="e.g. Special rate for first-time buyers"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="offer-rate">Rate / APR</Label>
              <Input
                id="offer-rate"
                value={form.rate ?? ""}
                onChange={(e) => updateField("rate", e.target.value)}
                placeholder="5.99% APR"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="offer-terms">Terms</Label>
              <Input
                id="offer-terms"
                value={form.terms ?? ""}
                onChange={(e) => updateField("terms", e.target.value)}
                placeholder="30-year fixed"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="offer-description">Description</Label>
            <Textarea
              id="offer-description"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="offer-valid-until">Valid until (optional)</Label>
            <Input
              id="offer-valid-until"
              type="date"
              value={form.validUntil ?? ""}
              onChange={(e) => updateField("validUntil", e.target.value)}
            />
          </div>

          <ImageInput
            id="offer-image"
            label="Image (optional)"
            value={form.imageUrl ?? ""}
            onChange={(value) => updateField("imageUrl", value)}
          />

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={submitting}>
              {isEditing ? "Save offer" : "Publish offer"}
            </Button>
            {isEditing && (
              <Button type="button" variant="outline" onClick={onEditComplete}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
