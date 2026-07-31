"use client";

import Image from "next/image";
import { useMemo } from "react";

import { FadeInSection } from "@/components/ui/fade-in-section";
import { useData } from "@/context/data-context";

export function LandingBuildersStrip() {
  const { builders } = useData();

  const list = useMemo(
    () => [...builders].sort((a, b) => a.name.localeCompare(b.name)),
    [builders],
  );

  if (list.length === 0) return null;

  return (
    <FadeInSection>
      <section
        aria-label="Partner builders"
        className="border-t border-white/10 bg-black px-6 py-8 md:py-10"
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {list.map((builder) => (
            <div
              key={builder.id}
              className="flex h-10 max-w-[160px] items-center justify-center opacity-80 transition hover:opacity-100"
            >
              {builder.logoUrl ? (
                <Image
                  src={builder.logoUrl}
                  alt={builder.name}
                  width={140}
                  height={40}
                  className="max-h-10 w-auto object-contain brightness-0 invert"
                  unoptimized={builder.logoUrl.startsWith("http")}
                />
              ) : (
                <span className="text-sm font-semibold uppercase tracking-[0.14em] text-white/70">
                  {builder.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>
    </FadeInSection>
  );
}
