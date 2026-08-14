"use client";

import { useState } from "react";

import { MultiImageInput } from "@/components/dashboard/multi-image-input";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { toastError, toastSuccess } from "@/lib/toast";
import type {
  ApartmentFloorPlan,
  ApartmentFloorPlanInput,
  ApartmentFloorPlanStatus,
} from "@/lib/types";

function linesToList(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

type FloorPlanFormState = ApartmentFloorPlanInput & {
  amenitiesText: string;
  highlightsText: string;
};

const emptyForm: FloorPlanFormState = {
  name: "",
  rent: 0,
  bedrooms: 1,
  bathrooms: 1,
  sqft: 0,
  imageUrls: [],
  description: "",
  status: "available",
  amenities: [],
  highlights: [],
  amenitiesText: "",
  highlightsText: "",
};

function toForm(plan: ApartmentFloorPlan): FloorPlanFormState {
  return {
    name: plan.name,
    rent: plan.rent,
    bedrooms: plan.bedrooms,
    bathrooms: plan.bathrooms,
    sqft: plan.sqft,
    imageUrls: plan.imageUrls ?? [],
    description: plan.description,
    status: plan.status ?? "available",
    amenities: plan.amenities ?? [],
    highlights: plan.highlights ?? [],
    amenitiesText: (plan.amenities ?? []).join("\n"),
    highlightsText: (plan.highlights ?? []).join("\n"),
  };
}

type ApartmentFloorPlanFormProps = {
  apartmentCommunityId: string;
  editingPlan: ApartmentFloorPlan | null;
  onEditComplete: () => void;
};

export function ApartmentFloorPlanForm({
  apartmentCommunityId,
  editingPlan,
  onEditComplete,
}: ApartmentFloorPlanFormProps) {
  const { apartmentCommunities, addFloorPlan, updateFloorPlan } =
    useDashboardData();
  const community = apartmentCommunities.find(
    (c) => c.id === apartmentCommunityId,
  );
  const [form, setForm] = useState<FloorPlanFormState>(() =>
    editingPlan ? toForm(editingPlan) : emptyForm,
  );
  const [submitting, setSubmitting] = useState(false);

  const isEditing = editingPlan !== null;

  function updateField<K extends keyof FloorPlanFormState>(
    field: K,
    value: FloorPlanFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toastError("Floor plan name is required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: ApartmentFloorPlanInput = {
        name: form.name.trim(),
        rent: Number(form.rent) || 0,
        bedrooms: Number(form.bedrooms) || 0,
        bathrooms: Number(form.bathrooms) || 0,
        sqft: Number(form.sqft) || 0,
        imageUrls: form.imageUrls,
        description: form.description.trim(),
        status: form.status,
        amenities: linesToList(form.amenitiesText),
        highlights: linesToList(form.highlightsText),
      };

      if (isEditing) {
        await updateFloorPlan(apartmentCommunityId, editingPlan.id, payload);
        toastSuccess("Floor plan updated.");
      } else {
        await addFloorPlan(apartmentCommunityId, payload);
        toastSuccess("Floor plan added.");
      }
      onEditComplete();
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl">
          {isEditing ? "Edit floor plan" : "Add floor plan"}
        </CardTitle>
        <CardDescription>
          {community
            ? `For ${community.name}`
            : "Monthly rent and unit layout for this apartment community."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="plan-name">Name</Label>
            <Input
              id="plan-name"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="plan-rent">Monthly rent</Label>
              <Input
                id="plan-rent"
                type="number"
                min={0}
                value={form.rent || ""}
                onChange={(e) =>
                  updateField("rent", Number(e.target.value) || 0)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status ?? "available"}
                onValueChange={(value) =>
                  updateField("status", value as ApartmentFloorPlanStatus)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="waitlist">Waitlist</SelectItem>
                  <SelectItem value="leased">Leased</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-beds">Bedrooms</Label>
              <Input
                id="plan-beds"
                type="number"
                min={0}
                value={form.bedrooms}
                onChange={(e) =>
                  updateField("bedrooms", Number(e.target.value) || 0)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-baths">Bathrooms</Label>
              <Input
                id="plan-baths"
                type="number"
                min={0}
                step={0.5}
                value={form.bathrooms}
                onChange={(e) =>
                  updateField("bathrooms", Number(e.target.value) || 0)
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="plan-sqft">Sq ft</Label>
              <Input
                id="plan-sqft"
                type="number"
                min={0}
                value={form.sqft || ""}
                onChange={(e) =>
                  updateField("sqft", Number(e.target.value) || 0)
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan-description">Description</Label>
            <Textarea
              id="plan-description"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
            />
          </div>

          <MultiImageInput
            label="Photos"
            value={form.imageUrls}
            onChange={(urls) => updateField("imageUrls", urls)}
          />

          <div className="space-y-2">
            <Label htmlFor="plan-amenities">Amenities (one per line)</Label>
            <Textarea
              id="plan-amenities"
              value={form.amenitiesText}
              onChange={(e) => updateField("amenitiesText", e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan-highlights">Highlights (one per line)</Label>
            <Textarea
              id="plan-highlights"
              value={form.highlightsText}
              onChange={(e) => updateField("highlightsText", e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "Saving…"
                : isEditing
                  ? "Save changes"
                  : "Add floor plan"}
            </Button>
            <Button type="button" variant="outline" onClick={onEditComplete}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
