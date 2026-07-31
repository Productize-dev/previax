"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingNav } from "@/components/landing/landing-nav";
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
import { BUILDER_CALENDLY_URL, FORMSPREE_URL } from "@/lib/config";
import {
  buildBuilderPartnerMailto,
  submitForm,
  type BuilderPartnerFormData,
} from "@/lib/forms";
import { MARKETING_HOME } from "@/lib/routes";

export function BuilderPartnerFlow() {
  const [step, setStep] = useState<"form" | "schedule">("form");
  const [submitting, setSubmitting] = useState(false);
  const [projectCount, setProjectCount] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const data: BuilderPartnerFormData = {
      companyName: String(fd.get("companyName")),
      contactName: String(fd.get("contactName")),
      email: String(fd.get("email")),
      phone: String(fd.get("phone")),
      markets: String(fd.get("markets")),
      projectCount,
      notes: String(fd.get("notes") ?? ""),
    };

    const result = await submitForm(FORMSPREE_URL || undefined, {
      type: "builder-partnership",
      ...data,
    });

    if (result.via === "api" && result.ok) {
      setStep("schedule");
    } else {
      const mailto = buildBuilderPartnerMailto(data);
      const anchor = document.createElement("a");
      anchor.href = mailto;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setStep("schedule");
    }
    setSubmitting(false);
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <LandingNav />

      <main className="mx-auto w-full max-w-xl flex-1 px-6 pb-20 pt-28">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
          Builder partnership
        </p>
        <h1 className="font-heading mt-3 text-3xl sm:text-4xl">
          {step === "form" ? "Tell us about your company" : "Schedule a meeting"}
        </h1>
        <p className="mt-3 text-white/65">
          {step === "form"
            ? "A short questionnaire — no account creation, no community uploads."
            : "Pick a time that works. We’ll follow up after the conversation."}
        </p>

        {step === "form" ? (
          <form onSubmit={handleSubmit} className="mt-10 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-white/80">
                Company / builder name
              </Label>
              <Input
                id="companyName"
                name="companyName"
                required
                className="border-white/15 bg-white/5 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactName" className="text-white/80">
                Your name
              </Label>
              <Input
                id="contactName"
                name="contactName"
                required
                className="border-white/15 bg-white/5 text-white"
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/80">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="border-white/15 bg-white/5 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-white/80">
                  Phone
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  className="border-white/15 bg-white/5 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="markets" className="text-white/80">
                Markets served
              </Label>
              <Input
                id="markets"
                name="markets"
                placeholder="e.g. Triad / Winston-Salem, NC"
                required
                className="border-white/15 bg-white/5 text-white placeholder:text-white/35"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">
                Active communities / projects
              </Label>
              <Select
                value={projectCount}
                onValueChange={(v) => setProjectCount(v ?? "")}
                required
              >
                <SelectTrigger className="w-full border-white/15 bg-white/5 text-white">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2-5">2–5</SelectItem>
                  <SelectItem value="6-10">6–10</SelectItem>
                  <SelectItem value="10+">10+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-white/80">
                Anything else? (optional)
              </Label>
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                className="border-white/15 bg-white/5 text-white"
              />
            </div>
            <Button
              type="submit"
              disabled={submitting || !projectCount}
              className="w-full gap-2 bg-primary text-primary-foreground hover:opacity-90"
            >
              {submitting ? "Submitting…" : "Continue to schedule"}
              <ArrowRight className="size-4" />
            </Button>
            <p className="text-center text-xs text-white/40">
              No account is created. Listings are set up after we meet.
            </p>
          </form>
        ) : (
          <div className="mt-10 space-y-8">
            <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              <p>
                Thanks — your details are in. Schedule a meeting below so we can
                talk through next steps.
              </p>
            </div>

            {BUILDER_CALENDLY_URL ? (
              <div className="overflow-hidden rounded-xl border border-white/15">
                <iframe
                  src={BUILDER_CALENDLY_URL}
                  title="Schedule a builder partnership meeting"
                  className="h-[630px] w-full bg-white"
                  loading="lazy"
                />
              </div>
            ) : (
              <p className="rounded-lg border border-white/15 bg-white/5 px-4 py-6 text-center text-sm text-white/70">
                Scheduling link is not configured yet. Email us at{" "}
                <a
                  href="mailto:inquiries@previax.com"
                  className="text-primary hover:underline"
                >
                  inquiries@previax.com
                </a>{" "}
                and we will find a time.
              </p>
            )}

            <p className="text-center text-sm text-white/50">
              <Link
                href={MARKETING_HOME}
                className="text-primary underline-offset-4 hover:underline"
              >
                ← Back to Previax
              </Link>
            </p>
          </div>
        )}
      </main>

      <LandingFooter />
    </div>
  );
}
