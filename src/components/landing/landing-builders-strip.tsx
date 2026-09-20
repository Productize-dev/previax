"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useData } from "@/context/data-context";
import { getMarketingBuilders } from "@/lib/community-builders";
import { APP_HOME } from "@/lib/routes";
import { cn } from "@/lib/utils";

function BuilderLogoMark({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl?: string;
}) {
  return (
    <div
      className={cn(
        "group relative flex h-[5.75rem] w-[12rem] shrink-0 items-center justify-center overflow-hidden rounded-xl px-5 sm:h-24 sm:w-[14rem] sm:px-6 md:h-28 md:w-[16rem]",
        "border border-white/10 bg-[#141210]",
        "transition duration-300 hover:border-white/20 hover:bg-[#1a1714]",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
      />
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={name}
          loading="lazy"
          decoding="async"
          className="max-h-10 w-auto max-w-full object-contain opacity-90 transition duration-300 group-hover:opacity-100 group-hover:scale-[1.03] sm:max-h-11 md:max-h-12"
        />
      ) : (
        <span className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-white/70 sm:text-sm">
          {name}
        </span>
      )}
    </div>
  );
}

export function LandingBuildersStrip() {
  const { builders } = useData();

  const list = useMemo(
    () => getMarketingBuilders(builders),
    [builders],
  );

  // Duplicate enough times so the -50% marquee loop stays seamless.
  const loop = useMemo(() => {
    if (list.length === 0) return [];
    const copies = Math.max(2, Math.ceil(6 / Math.max(list.length, 1))) * 2;
    return Array.from({ length: copies }, () => list).flat();
  }, [list]);

  if (list.length === 0) return null;

  return (
    <section
      aria-label="Partner builders"
      className="relative overflow-hidden py-14 md:py-20"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,120,0.08),transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
      />

      <div className="relative mx-auto mb-8 max-w-2xl px-[4%] text-center md:mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
          Trusted builders
        </p>
        <h2 className="font-heading mt-2 text-3xl text-white sm:text-4xl">
          Partners across North Carolina
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-white/55 sm:text-base">
          The same builders you&apos;ll explore in the catalog — featured communities,
          floor plans, and video tours in one place.
        </p>
      </div>

      <div className="landing-logo-marquee relative">
        <div className="landing-logo-marquee-fade pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-black via-black/80 to-transparent sm:w-24 md:w-36" />
        <div className="landing-logo-marquee-fade pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-black via-black/80 to-transparent sm:w-24 md:w-36" />

        <div className="landing-logo-marquee-track flex w-max gap-4 sm:gap-5 md:gap-6">
          {loop.map((builder, i) => (
            <BuilderLogoMark
              key={`${builder.id}-${i}`}
              name={builder.name}
              logoUrl={builder.logoUrl}
            />
          ))}
        </div>
      </div>

      <div className="relative mt-8 flex justify-center px-[4%] md:mt-10">
        <Link
          href={`${APP_HOME}#nav-communities`}
          className="text-sm font-medium text-white/55 transition-colors hover:text-primary"
        >
          Browse communities by builder →
        </Link>
      </div>
    </section>
  );
}
