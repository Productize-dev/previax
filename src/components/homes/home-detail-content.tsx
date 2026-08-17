"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Copy, ExternalLink } from "lucide-react";

import { BuilderOffers } from "@/components/communities/builder-offers";
import { RealtorCard } from "@/components/communities/realtor-card";
import { CalendlyEmbed } from "@/components/buyer/calendly-embed";
import { BuyerActionButtons } from "@/components/buyer/buyer-action-buttons";
import { NetflixNavbar } from "@/components/home/netflix-navbar";
import { NetflixVideoOverlay } from "@/components/communities/netflix-video-overlay";
import { HomeGallerySection } from "@/components/homes/home-gallery-section";
import { HomeHero } from "@/components/homes/home-hero";
import { HomeHighlightsSection } from "@/components/homes/home-highlights-section";
import { HomeReviewsSection } from "@/components/homes/home-reviews-section";
import { HomeRoomsSection } from "@/components/homes/home-rooms-section";
import { MortgageCalculator } from "@/components/homes/mortgage-calculator";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { FadeInSection } from "@/components/ui/fade-in-section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useData } from "@/context/data-context";
import { getAvailableModels } from "@/lib/community-media";
import { APP_HOME } from "@/lib/routes";
import { FORMSPREE_URL } from "@/lib/config";
import { buildVisitMailto, submitForm } from "@/lib/forms";

export default function HomeDetailContent() {
  const params = useParams<{ id: string; homeId: string }>();
  const { communities, isLoaded } = useData();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [overlayIndex, setOverlayIndex] = useState(0);

  const community = communities.find((c) => c.id === params.id);
  const home = community?.homes.find((h) => h.id === params.homeId);
  const models = useMemo(
    () => (community ? getAvailableModels(community) : []),
    [community],
  );
  const homeIndex = home ? models.findIndex((item) => item.id === home.id) : 0;

  const shareUrl =
    typeof window !== "undefined" && community && home
      ? `${window.location.origin}/communities/${community.id}/homes/${home.id}`
      : "";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!community || !home) return;
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      type: "visit",
      community: community.name,
      homePrice: String(home.price),
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
          communityName: community.name,
          homePrice: home.price,
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

  async function copyShareLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#141414]">
        <NetflixNavbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-[#b3b3b3]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!community || !home) {
    return (
      <div className="min-h-screen bg-[#141414] text-white">
        <NetflixNavbar />
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
          <h1 className="font-heading text-2xl">Home Not Found</h1>
          <Link href={APP_HOME} className="text-[#46d369] hover:underline">
            ← Back to communities
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <NetflixNavbar />

      <nav className="mx-auto max-w-6xl px-[4%] pt-24 text-sm text-[#b3b3b3]">
        <Link href={APP_HOME} className="hover:text-white">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/communities/${community.id}`} className="hover:text-white">
          {community.name}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-white">${home.price.toLocaleString()}</span>
      </nav>

      <HomeHero
        home={home}
        community={community}
        onPlay={() => {
          setOverlayIndex(Math.max(homeIndex, 0));
          setPlayerOpen(true);
        }}
      />

      <main className="mx-auto max-w-6xl px-[4%] py-10 pb-24 md:pb-12">
        <FadeInSection>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <p className="max-w-3xl text-lg leading-relaxed text-[#b3b3b3]">
              {home.description}
            </p>
            <BuyerActionButtons
              homeId={home.id}
              homeCommunityId={community.id}
              variant="dark"
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={copyShareLink}>
              <Copy className="size-4" />
              {copied ? "Copied!" : "Share link"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              render={<Link href={`/communities/${community.id}`} />}
              nativeButton={false}
            >
              <ExternalLink className="size-4" />
              View community
            </Button>
          </div>
        </FadeInSection>

        <div className="mt-16 space-y-20">
          <HomeGallerySection home={home} communityName={community.name} />

          <HomeHighlightsSection home={home} />

          <HomeRoomsSection home={home} />

          <FadeInSection>
            <MortgageCalculator price={home.price} />
          </FadeInSection>

          <HomeReviewsSection home={home} />

          <FadeInSection>
            <BuilderOffers
              builderName={community.builderName}
              builderOffers={community.builderOffers}
              offerExpires={community.offerExpires}
            />
          </FadeInSection>

          <FadeInSection>
            <section>
              <h2 className="font-heading mb-4 text-2xl">Your Realtor</h2>
              <RealtorCard
                name={community.realtorName}
                photoUrl={community.realtorPhotoUrl}
                communityName={community.name}
              />
            </section>
          </FadeInSection>

          <FadeInSection>
            <CalendlyEmbed />
          </FadeInSection>

          <FadeInSection>
            <section id="visit">
              <p className="section-eyebrow">Take the next step</p>
              <h2 className="font-heading mt-2 text-2xl">Schedule a visit</h2>
              {submitted ? (
                <p className="mt-4 rounded-lg bg-primary/10 px-4 py-3 text-sm text-primary">
                  Thank you! We&apos;ll be in touch shortly.
                </p>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="hp-name">Name</Label>
                    <Input id="hp-name" name="name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hp-email">Email</Label>
                    <Input id="hp-email" name="email" type="email" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hp-phone">Phone</Label>
                    <Input id="hp-phone" name="phone" type="tel" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hp-date">Preferred Date</Label>
                    <Input id="hp-date" name="date" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hp-notes">Notes</Label>
                    <Textarea id="hp-notes" name="notes" rows={2} />
                  </div>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Sending..." : "Request Visit"}
                  </Button>
                </form>
              )}
            </section>
          </FadeInSection>
        </div>
      </main>

      <NetflixVideoOverlay
        open={playerOpen}
        community={community}
        home={models[overlayIndex] ?? home}
        homeIndex={overlayIndex}
        models={models}
        onClose={() => setPlayerOpen(false)}
        onChangeHome={setOverlayIndex}
      />

      <SiteFooter />
    </div>
  );
}
