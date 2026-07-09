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
import { Textarea } from "@/components/ui/textarea";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import type { Lender, LenderInput } from "@/lib/types";

const emptyForm: LenderInput = {
  name: "",
  description: "",
  imageUrl: "",
};

type LenderFormProps = {
  editingItem: Lender | null;
  onEditComplete: () => void;
};

export function LenderForm({ editingItem, onEditComplete }: LenderFormProps) {
  const { addLender, updateLender } = useDashboardData();
  const [form, setForm] = useState<LenderInput>(
    editingItem
      ? {
          name: editingItem.name,
          description: editingItem.description,
          imageUrl: editingItem.imageUrl ?? "",
        }
      : emptyForm,
  );
  const [submitting, setSubmitting] = useState(false);

  const isEditing = editingItem !== null;

  function updateField<K extends keyof LenderInput>(
    field: K,
    value: LenderInput[K],
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.description.trim()) return;

    setSubmitting(true);
    try {
      if (isEditing) {
        await updateLender(editingItem.id, form);
        onEditComplete();
      } else {
        await addLender(form);
      }
      setForm(emptyForm);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl">
          {isEditing ? "Edit Lender" : "Add Lender"}
        </CardTitle>
        <CardDescription>
          Lenders appear in a dedicated row on the homepage with their photo or
          logo, name, and description. Image is optional.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lender-name">Name</Label>
            <Input
              id="lender-name"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Company or loan officer name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lender-description">Description</Label>
            <Textarea
              id="lender-description"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
              placeholder="Short bio or what they specialize in"
              required
            />
          </div>

          <ImageInput
            id="lender-image"
            label="Photo or logo (optional)"
            value={form.imageUrl ?? ""}
            onChange={(value) => updateField("imageUrl", value)}
            hint="Leave empty to show initials on the homepage."
          />

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={submitting}>
              {isEditing ? "Save Lender" : "Add Lender"}
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
