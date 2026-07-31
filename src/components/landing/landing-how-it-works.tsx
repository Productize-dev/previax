"use client";

import type { LandingAudience } from "@/components/landing/landing-hero";
import { FadeInSection } from "@/components/ui/fade-in-section";

const BUYER_STEPS = [
  {
    title: "Browse the catalog",
    body: "Cinematic rows of communities, homes, and video tours — curated for new construction.",
  },
  {
    title: "Search your way",
    body: "Describe what you want in plain language. Save favorites and get matched guidance.",
  },
  {
    title: "Talk to an expert",
    body: "Connect with a dedicated realtor and preferred lenders when you are ready to move.",
  },
] as const;

const BUILDER_STEPS = [
  {
    title: "Share your pipeline",
    body: "A short questionnaire covers your company, markets, and active communities.",
  },
  {
    title: "Meet the team",
    body: "Schedule a partnership call — we align on fit, positioning, and next steps.",
  },
  {
    title: "Go live with us",
    body: "Previax lists and presents your communities. No DIY account or uploads from day one.",
  },
] as const;

type LandingHowItWorksProps = {
  audience: LandingAudience;
};

export function LandingHowItWorks({ audience }: LandingHowItWorksProps) {
  const steps = audience === "buyer" ? BUYER_STEPS : BUILDER_STEPS;

  return (
    <FadeInSection>
      <section className="border-t border-white/10 bg-[#0a0a0a] px-6 py-20 md:py-28">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-sm font-medium uppercase tracking-[0.2em] text-primary">
            How it works
          </p>
          <h2 className="font-heading mt-3 text-center text-3xl text-white sm:text-4xl">
            {audience === "buyer"
              ? "From browse to next step"
              : "From interest to partnership"}
          </h2>

          <ol
            key={audience}
            className="mt-14 space-y-10 opacity-0 animate-[landing-fade-up_0.5s_ease-out_forwards]"
          >
            {steps.map((step, i) => (
              <li
                key={step.title}
                className="flex flex-col gap-3 border-l border-primary/40 pl-6 sm:flex-row sm:items-baseline sm:gap-8"
              >
                <span className="font-heading text-3xl text-primary/80 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <p className="mt-14 text-center text-sm text-white/45">
            Preferred lenders are part of the network too — financing partners
            for buyers ready to move.
          </p>
        </div>
      </section>
    </FadeInSection>
  );
}
