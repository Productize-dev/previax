"use client";

import Link from "next/link";
import { ArrowRight, Crosshair, Play } from "lucide-react";

import { YouTubeEmbed } from "@/components/video/youtube-embed";
import { PreviaxLogo } from "@/components/layout/previax-logo";
import { MARKETING_HERO_YOUTUBE_URL } from "@/lib/config";
import { APP_HOME, PARTNER_PATH } from "@/lib/routes";
import { getWatchUrl } from "@/lib/youtube";
import { cn } from "@/lib/utils";

export type LandingAudience = "buyer" | "builder";

type LandingHeroProps = {
  audience: LandingAudience;
  onAudienceChange: (audience: LandingAudience) => void;
};

const COPY: Record<
  LandingAudience,
  { headline: React.ReactNode; sub: string; primaryCta: string; primaryHref: string }
> = {
  buyer: {
    headline: (
      <>
        Explore{" "}
        <span className="text-primary">New Construction</span> Communities
      </>
    ),
    sub: "Compare builders, explore communities, and visualize your future home before you buy.",
    primaryCta: "Get Started",
    primaryHref: APP_HOME,
  },
  builder: {
    headline: (
      <>
        Reach serious buyers on a{" "}
        <span className="text-primary">video-first</span> marketplace
      </>
    ),
    sub: "Partner with Previax to showcase your communities where shoppers already explore new construction.",
    primaryCta: "Become a Builder",
    primaryHref: PARTNER_PATH,
  },
};

export function LandingHero({ audience, onAudienceChange }: LandingHeroProps) {
  const copy = COPY[audience];
  const watchUrl = getWatchUrl(MARKETING_HERO_YOUTUBE_URL);

  return (
    <section className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden px-6 pb-24 pt-28">
      <div className="absolute inset-0">
        <YouTubeEmbed
          youtubeUrl={MARKETING_HERO_YOUTUBE_URL}
          title="Previax"
          preset="background"
          loading="eager"
          fillContainer
          cover
          className="absolute inset-0 size-full"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.75)_75%)]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-3xl text-center">
        <div className="mb-8 flex justify-center opacity-0 animate-[landing-fade-up_0.8s_ease-out_0.15s_forwards]">
          <PreviaxLogo height={64} asLink={false} className="brightness-110" />
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
              href={copy.primaryHref}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {copy.primaryCta}
              <ArrowRight className="size-4" />
            </Link>
            {audience === "buyer" ? (
              <Link
                href="/guidance"
                className="inline-flex items-center gap-2 rounded-md border border-white/25 bg-black/40 px-7 py-3.5 text-base font-medium text-white backdrop-blur-sm transition-colors hover:border-white/50 hover:bg-white/5"
              >
                <Crosshair className="size-4" />
                Get Personalized Guidance
              </Link>
            ) : (
              <a
                href="#builders"
                className="inline-flex items-center gap-2 rounded-md border border-white/25 bg-black/40 px-7 py-3.5 text-base font-medium text-white backdrop-blur-sm transition-colors hover:border-white/50 hover:bg-white/5"
              >
                See our partners
              </a>
            )}
          </div>

          {watchUrl && audience === "buyer" && (
            <div className="mt-6">
              <a
                href={watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-primary"
              >
                <Play className="size-3.5 fill-current" />
                See how Previax works
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
