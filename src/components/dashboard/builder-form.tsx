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
import {
  builderToDashboardForm,
  emptyBuilderDashboardForm,
  toBuilderInput,
  type BuilderDashboardForm,
} from "@/lib/dashboard-defaults";
import type { Builder } from "@/lib/types";
import { isValidYouTubeUrl } from "@/lib/youtube";

type BuilderFormProps = {
  editingBuilder: Builder | null;
  onEditComplete: () => void;
};

export function BuilderForm({
  editingBuilder,
  onEditComplete,
}: BuilderFormProps) {
  const { addBuilder, updateBuilder } = useDashboardData();
  const [form, setForm] = useState<BuilderDashboardForm>(() =>
    editingBuilder
      ? builderToDashboardForm(editingBuilder)
      : emptyBuilderDashboardForm,
  );
  const [submitting, setSubmitting] = useState(false);
  const [youtubeError, setYoutubeError] = useState("");

  const isEditing = editingBuilder !== null;

  function updateField<K extends keyof BuilderDashboardForm>(
    field: K,
    value: BuilderDashboardForm[K],
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "youtubeUrl") setYoutubeError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;

    const youtube = form.youtubeUrl.trim();
    if (youtube && !isValidYouTubeUrl(youtube)) {
      setYoutubeError("Please enter a valid YouTube URL");
      return;
    }

    const payload = toBuilderInput(form);

    setSubmitting(true);
    try {
      if (isEditing) {
        await updateBuilder(editingBuilder.id, payload);
        onEditComplete();
      } else {
        await addBuilder(payload);
      }
      setForm(emptyBuilderDashboardForm);
      setYoutubeError("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl">
          {isEditing ? "Edit Builder" : "Add Builder"}
        </CardTitle>
        <CardDescription>
          Builder profiles group communities and home models. Add a marketing
          video to feature this builder on the landing page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="builder-name">Builder name</Label>
            <Input
              id="builder-name"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="builder-description">Description</Label>
            <Textarea
              id="builder-description"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
              placeholder="What this builder is known for"
            />
          </div>

          <ImageInput
            id="builder-logo"
            label="Logo (optional)"
            value={form.logoUrl}
            onChange={(value) => updateField("logoUrl", value)}
          />

          <div className="space-y-2">
            <Label htmlFor="builder-youtube">Marketing video (YouTube)</Label>
            <Input
              id="builder-youtube"
              type="url"
              value={form.youtubeUrl}
              onChange={(e) => updateField("youtubeUrl", e.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
              aria-invalid={Boolean(youtubeError)}
            />
            {youtubeError ? (
              <p className="text-sm text-destructive">{youtubeError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Shown on the marketing landing “Meet the Builders” row.
                Optional.
              </p>
            )}
          </div>

          <label
            htmlFor="builder-show-marketing"
            className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/30 px-3 py-3"
          >
            <input
              id="builder-show-marketing"
              type="checkbox"
              checked={form.showOnMarketing}
              onChange={(e) =>
                updateField("showOnMarketing", e.target.checked)
              }
              className="mt-1 size-4 rounded border-border accent-primary"
            />
            <span>
              <span className="block text-sm font-medium">
                Show on marketing site
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Controls both “Trusted builders” and “Meet the Builders” on the
                public landing.
              </span>
            </span>
          </label>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={submitting}>
              {isEditing ? "Save Builder" : "Add Builder"}
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
