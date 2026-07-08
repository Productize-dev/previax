"use client";

import Link from "next/link";
import { useState } from "react";

import { CommunityCard } from "@/components/communities/community-card";
import { GuidanceForm } from "@/components/buyer/guidance-form";
import { Navbar } from "@/components/layout/navbar";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useData } from "@/context/data-context";
import { getPriceRange } from "@/lib/community-utils";

export function GuidanceQuiz() {
  const { communities } = useData();
  const [step, setStep] = useState(0);
  const [budget, setBudget] = useState("");
  const [city, setCity] = useState("");
  const [beds, setBeds] = useState("");
  const [results, setResults] = useState<typeof communities>([]);

  function scoreCommunity(c: (typeof communities)[0]) {
    let score = 0;
    const range = getPriceRange(c);
    if (!range) return score;

    if (budget === "Under $400K" && range.max <= 450000) score += 3;
    if (budget === "$400K – $550K" && range.min >= 350000 && range.max <= 600000) score += 3;
    if (budget === "$550K – $700K" && range.min >= 500000 && range.max <= 750000) score += 3;
    if (budget === "$700K+" && range.min >= 650000) score += 3;

    if (city && city !== "any-city" && c.city.toLowerCase().includes(city.toLowerCase())) score += 4;

    if (beds && beds !== "any-beds") {
      const minBeds = Number(beds);
      const maxBeds = Math.max(...c.homes.map((h) => h.bedrooms), 0);
      if (maxBeds >= minBeds) score += 2;
    }

    if (c.builderOffers.trim()) score += 1;
    return score;
  }

  function getResults() {
    const scored = communities
      .map((c) => ({ c, score: scoreCommunity(c) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((x) => x.c);
    setResults(scored.length ? scored : communities.slice(0, 3));
    setStep(3);
  }

  if (step === 3) {
    return (
      <div className="space-y-6">
        <h3 className="font-heading text-2xl">Your top matches</h3>
        <p className="text-muted-foreground">
          Based on your preferences, these communities are a great starting point.
        </p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((c) => (
            <CommunityCard key={c.id} community={c} />
          ))}
        </div>
        <Button variant="outline" onClick={() => setStep(0)}>
          Start over
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      {step === 0 && (
        <>
          <h3 className="font-heading text-xl">What&apos;s your budget?</h3>
          <Select value={budget} onValueChange={(v) => setBudget(v ?? "")}>
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
          <Button className="w-full" disabled={!budget} onClick={() => setStep(1)}>
            Next
          </Button>
        </>
      )}
      {step === 1 && (
        <>
          <h3 className="font-heading text-xl">Preferred city?</h3>
          <Select value={city} onValueChange={(v) => setCity(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Any city" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any-city">Any city</SelectItem>
              {[...new Set(communities.map((c) => c.city))].map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(0)}>Back</Button>
            <Button className="flex-1" onClick={() => setStep(2)}>Next</Button>
          </div>
        </>
      )}
      {step === 2 && (
        <>
          <h3 className="font-heading text-xl">Minimum bedrooms?</h3>
          <Select value={beds} onValueChange={(v) => setBeds(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any-beds">Any</SelectItem>
              <SelectItem value="3">3+</SelectItem>
              <SelectItem value="4">4+</SelectItem>
              <SelectItem value="5">5+</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button className="flex-1" onClick={getResults}>See matches</Button>
          </div>
        </>
      )}
    </div>
  );
}

export function GuidancePageContent() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="text-center">
          <h1 className="font-heading text-3xl">Get Personalized Guidance</h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Not sure where to start? Take our quick quiz or tell us what
            you&apos;re looking for — we&apos;ll match you with the right
            communities.
          </p>
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-heading mb-6 text-xl">Quick match quiz</h2>
            <GuidanceQuiz />
          </div>
          <div>
            <h2 className="font-heading mb-6 text-xl">Talk to an expert</h2>
            <GuidanceForm />
          </div>
        </div>

        <p className="mt-12 text-center text-sm text-muted-foreground">
          Or <Link href="/#communities" className="text-primary hover:underline">browse all communities</Link>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
