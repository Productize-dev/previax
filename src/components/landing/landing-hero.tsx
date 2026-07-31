"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { LandingPosterWall } from "@/components/landing/landing-poster-wall";
import { PreviaxLogo } from "@/components/layout/previax-logo";
import { APP_HOME, PARTNER_PATH } from "@/lib/routes";
import { cn } from "@/lib/utils";

export type LandingAudience = "buyer" | "builder";

type LandingHeroProps = {
  audience: LandingAudience;
  onAudienceChange: (audience: LandingAudience) => void;
};

const COPY: Record<
  LandingAudience,
  { headline: string; sub: string; cta: string; href: string }
> = {
  buyer: {
    headline: "Explore new construction communities — before you buy.",
    sub: "Compare builders, watch cinematic tours, and get personalized guidance across North Carolina.",
    cta: "Get Started",
    href: APP_HOME,
  },
  builder: {
    headline: "Reach serious buyers on a video-first marketplace.",
    sub: "Partner with Previax to showcase your communities where shoppers already explore new construction.",
    cta: "Become a Builder",
    href: PARTNER_PATH,
  },
};

export function LandingHero({ audience, onAudienceChange }: LandingHeroProps) {
  const copy = COPY[audience];

  return (
    <section className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden px-6 pb-20 pt-28">
      <LandingPosterWall />

      <div className="relative z-10 mx-auto w-full max-w-3xl text-center">
        <div className="mb-8 flex justify-center opacity-0 animate-[landing-fade-up_0.8s_ease-out_0.15s_forwards]">
          <PreviaxLogo height={72} asLink={false} className="brightness-110" />
        </div>

        <div
          className="mb-8 inline-flex rounded-full border border-white/15 bg-black/40 p-1 backdrop-blur-sm opacity-0 animate-[landing-fade-up_0.8s_ease-out_0.25s_forwards]"
          role="tablist"
          aria-label="Choose your path"
        >
          {(
            [
              { id: "buyer", label: "I'm Buying" },
              { id: "builder", label: "I'm a Builder" },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={audience === id}
              onClick={() => onAudienceChange(id)}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-medium transition-colors",
                audience === id
                  ? "bg-primary text-primary-foreground"
                  : "text-white/70 hover:text-white",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div
          key={audience}
          className="opacity-0 animate-[landing-fade-up_0.55s_ease-out_forwards]"
        >
          <h1 className="font-heading text-4xl leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
            {copy.headline}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
            {copy.sub}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={copy.href}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {copy.cta}
              <ArrowRight className="size-4" />
            </Link>
            {audience === "buyer" && (
              <Link
                href="/login"
                className="inline-flex items-center rounded-md border border-white/25 px-7 py-3.5 text-base font-medium text-white transition-colors hover:border-white/50 hover:bg-white/5"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
