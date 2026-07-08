"use client";

import Link from "next/link";
import { useState } from "react";
import { Bed, Bath, ChevronLeft, ChevronRight, Copy, ExternalLink, Maximize } from "lucide-react";

import { MortgageCalculator } from "@/components/homes/mortgage-calculator";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FORMSPREE_URL } from "@/lib/config";
import { buildVisitMailto, submitForm } from "@/lib/forms";
import type { Home } from "@/lib/types";

type HomeDetailModalProps = {
  home: Home | null;
  communityId: string;
  communityName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function HomeDetailModal({
  home,
  communityId,
  communityName,
  open,
  onOpenChange,
}: HomeDetailModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!home) return null;

  const images = home.imageUrls;
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/communities/${communityId}/homes/${home.id}`
      : "";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      type: "visit",
      community: communityName,
      homePrice: String(home!.price),
      name: String(fd.get("name")),
      email: String(fd.get("email")),
      phone: String(fd.get("phone")),
      date: String(fd.get("date")),
      notes: String(fd.get("notes") ?? ""),
    };

    const result = await submitForm(FORMSPREE_URL || undefined, payload);
    if (result.via === "api" && result.ok) {
      setSubmitted(true);
      e.currentTarget.reset();
    } else {
      globalThis.location.assign(
        buildVisitMailto({
          communityName,
          homePrice: home!.price,
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          date: payload.date,
          notes: payload.notes,
        }),
      );
    }
    setSubmitting(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setSubmitted(false);
      setActiveIndex(0);
      setCopied(false);
    }
    onOpenChange(next);
  }

  async function copyShareLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            ${home.price.toLocaleString()} — {communityName}
          </DialogTitle>
        </DialogHeader>

        {images.length > 0 && (
          <div className="relative">
            <img
              src={images[activeIndex]}
              alt={`Photo ${activeIndex + 1}`}
              className="aspect-[4/3] w-full rounded-lg object-cover"
            />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveIndex((i) => (i === 0 ? images.length - 1 : i - 1))}
                  className="absolute top-1/2 left-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveIndex((i) => (i === images.length - 1 ? 0 : i + 1))}
                  className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white"
                >
                  <ChevronRight className="size-5" />
                </button>
                <div className="mt-2 flex gap-2 overflow-x-auto">
                  {images.map((url, i) => (
                    <button
                      key={`${url.slice(0, 24)}-${i}`}
                      type="button"
                      onClick={() => setActiveIndex(i)}
                      className={`h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 ${
                        i === activeIndex ? "border-primary" : "border-transparent opacity-60"
                      }`}
                    >
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Bed className="size-4" />
            {home.bedrooms} bed
          </span>
          <span className="flex items-center gap-1">
            <Bath className="size-4" />
            {home.bathrooms} bath
          </span>
          <span className="flex items-center gap-1">
            <Maximize className="size-4" />
            {home.sqft.toLocaleString()} sqft
          </span>
        </div>

        <p className="text-sm leading-relaxed">{home.description}</p>

        <MortgageCalculator price={home.price} />

        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={copyShareLink}>
            <Copy className="size-4" />
            {copied ? "Copied!" : "Share link"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            render={<Link href={`/communities/${communityId}/homes/${home.id}`} />}
            nativeButton={false}
          >
            <ExternalLink className="size-4" />
            Full details
          </Button>
        </div>

        <hr className="border-border" />

        <div>
          <h3 className="font-heading mb-4 text-lg">Schedule a Visit</h3>
          {submitted ? (
            <p className="rounded-lg bg-primary/10 px-4 py-3 text-sm text-primary">
              Thank you! We&apos;ll be in touch shortly to schedule your visit.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="visit-name">Name</Label>
                <Input id="visit-name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="visit-email">Email</Label>
                <Input id="visit-email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="visit-phone">Phone</Label>
                <Input id="visit-phone" name="phone" type="tel" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="visit-date">Preferred Date</Label>
                <Input id="visit-date" name="date" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="visit-notes">Notes (optional)</Label>
                <Textarea id="visit-notes" name="notes" rows={2} />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Sending..." : "Request Visit"}
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
