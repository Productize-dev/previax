"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
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
import { FORMSPREE_URL } from "@/lib/config";
import { buildGuidanceMailto, submitForm } from "@/lib/forms";
import type { GuidanceFormData } from "@/lib/types";

export function GuidanceForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const data: GuidanceFormData = {
      email: String(fd.get("email")),
      budget,
      cities: String(fd.get("cities")),
      timeline,
      notes: String(fd.get("notes") ?? ""),
    };

    const result = await submitForm(FORMSPREE_URL || undefined, {
      type: "guidance",
      ...data,
    });

    if (result.via === "api" && result.ok) {
      setSubmitted(true);
    } else {
      globalThis.location.assign(buildGuidanceMailto(data));
    }
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <p className="rounded-lg bg-primary/10 px-4 py-3 text-sm text-primary">
        Thank you! A community expert will reach out within 1–2 business days.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-4 text-left">
      <div className="space-y-2">
        <Label htmlFor="g-email">Email</Label>
        <Input id="g-email" name="email" type="email" required />
      </div>
      <div className="space-y-2">
        <Label>Budget range</Label>
        <Select value={budget} onValueChange={(v) => setBudget(v ?? "")} required>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select budget" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Under $400K">Under $400K</SelectItem>
            <SelectItem value="$400K – $550K">$400K – $550K</SelectItem>
            <SelectItem value="$550K – $700K">$550K – $700K</SelectItem>
            <SelectItem value="$700K+">$700K+</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="g-cities">Preferred cities</Label>
        <Input
          id="g-cities"
          name="cities"
          placeholder="e.g. Raleigh, Wilmington"
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Timeline</Label>
        <Select value={timeline} onValueChange={(v) => setTimeline(v ?? "")} required>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="When are you buying?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Within 3 months">Within 3 months</SelectItem>
            <SelectItem value="3–6 months">3–6 months</SelectItem>
            <SelectItem value="6–12 months">6–12 months</SelectItem>
            <SelectItem value="Just exploring">Just exploring</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="g-notes">Anything else? (optional)</Label>
        <Textarea id="g-notes" name="notes" rows={2} />
      </div>
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={submitting || !budget || !timeline}
      >
        {submitting ? "Sending..." : "Get Personalized Guidance"}
      </Button>
    </form>
  );
}
