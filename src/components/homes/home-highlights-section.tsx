"use client";

import { FadeInSection } from "@/components/ui/fade-in-section";
import type { Home } from "@/lib/types";

type HomeHighlightsSectionProps = {
  home: Home;
};

export function HomeHighlightsSection({ home }: HomeHighlightsSectionProps) {
  const highlights = home.highlights ?? [];
  const hasContent = highlights.length > 0 || home.featuresOverview;

  if (!hasContent) return null;

  return (
    <FadeInSection>
      <section>
        <p className="section-eyebrow">This home</p>
        <h2 className="font-heading mt-2 text-3xl md:text-4xl">
          Highlights & features
        </h2>
        {home.featuresOverview && (
          <p className="mt-4 max-w-3xl leading-relaxed text-muted-foreground">
            {home.featuresOverview}
          </p>
        )}
        {highlights.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {highlights.map((item) => (
              <span
                key={item}
                className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm text-primary"
              >
                {item}
              </span>
            ))}
          </div>
        )}
      </section>
    </FadeInSection>
  );
}
