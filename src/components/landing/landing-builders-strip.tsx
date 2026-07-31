"use client";

import { useMemo } from "react";

import { useData } from "@/context/data-context";
import { getMarketingBuilders } from "@/lib/community-builders";

function BuilderLogoMark({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl?: string;
}) {
  return (
    <div className="flex h-20 w-[200px] shrink-0 items-center justify-center rounded-xl bg-white px-6 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/10 sm:h-24 sm:w-[240px] sm:px-8 md:h-28 md:w-[280px]">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={name}
          className="max-h-12 w-auto max-w-full object-contain sm:max-h-14 md:max-h-16"
        />
      ) : (
        <span className="text-center text-sm font-bold uppercase tracking-[0.16em] text-neutral-800 sm:text-base">
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
      className="relative overflow-hidden border-t border-white/10 bg-gradient-to-b from-black via-[#0c0c0c] to-black py-12 md:py-16"
    >
      <p className="mb-8 px-[4%] text-center text-xs font-semibold uppercase tracking-[0.28em] text-primary/90">
        Trusted builders
      </p>

      <div className="landing-logo-marquee relative">
        <div className="landing-logo-marquee-fade pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-black to-transparent sm:w-24 md:w-32" />
        <div className="landing-logo-marquee-fade pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-black to-transparent sm:w-24 md:w-32" />

        <div className="landing-logo-marquee-track flex w-max gap-5 sm:gap-6 md:gap-8">
          {loop.map((builder, i) => (
            <BuilderLogoMark
              key={`${builder.id}-${i}`}
              name={builder.name}
              logoUrl={builder.logoUrl}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
