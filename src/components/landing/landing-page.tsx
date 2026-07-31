"use client";

import { useState } from "react";

import { LandingBuildersStrip } from "@/components/landing/landing-builders-strip";
import { LandingCtaBand } from "@/components/landing/landing-cta-band";
import { LandingFooter } from "@/components/landing/landing-footer";
import {
  LandingHero,
  type LandingAudience,
} from "@/components/landing/landing-hero";
import { LandingMeetBuilders } from "@/components/landing/landing-meet-builders";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingNetwork } from "@/components/landing/landing-network";
import { LandingTopNcRow } from "@/components/landing/landing-top-nc-row";
import { LandingTrendingCommunities } from "@/components/landing/landing-trending-communities";

export function LandingPage() {
  const [audience, setAudience] = useState<LandingAudience>("buyer");

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <LandingNav />
      <LandingHero audience={audience} onAudienceChange={setAudience} />
      <LandingBuildersStrip />
      <LandingTrendingCommunities />
      <LandingTopNcRow />
      <LandingMeetBuilders />
      <LandingNetwork />
      <LandingCtaBand audience={audience} />
      <LandingFooter />
    </div>
  );
}
