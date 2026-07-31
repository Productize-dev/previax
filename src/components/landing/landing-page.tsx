"use client";

import { useState } from "react";

import { LandingCtaBand } from "@/components/landing/landing-cta-band";
import { LandingFooter } from "@/components/landing/landing-footer";
import {
  LandingHero,
  type LandingAudience,
} from "@/components/landing/landing-hero";
import { LandingHowItWorks } from "@/components/landing/landing-how-it-works";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingProof } from "@/components/landing/landing-proof";

export function LandingPage() {
  const [audience, setAudience] = useState<LandingAudience>("buyer");

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <LandingNav />
      <LandingHero audience={audience} onAudienceChange={setAudience} />
      <LandingProof audience={audience} />
      <LandingHowItWorks audience={audience} />
      <LandingCtaBand />
      <LandingFooter />
    </div>
  );
}
