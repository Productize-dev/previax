"use client";

import { GraduationCap, MapPin, Star } from "lucide-react";

import { FadeInSection } from "@/components/ui/fade-in-section";
import type { Community } from "@/lib/types";

const schoolTypeLabels: Record<string, string> = {
  elementary: "Elementary",
  middle: "Middle School",
  high: "High School",
  private: "Private",
  other: "School",
};

type CommunitySchoolsSectionProps = {
  community: Community;
};

export function CommunitySchoolsSection({
  community,
}: CommunitySchoolsSectionProps) {
  const schools = community.schools ?? [];
  const hasContent = schools.length > 0 || community.schoolOverview;

  if (!hasContent) return null;

  return (
    <FadeInSection>
      <section className="relative -mx-6 overflow-hidden rounded-none bg-card/40 px-6 py-14 md:-mx-[calc((100vw-72rem)/2+1.5rem)] md:px-[calc((100vw-72rem)/2+1.5rem)]">
        <div className="mx-auto max-w-6xl">
          <p className="section-eyebrow">Education</p>
          <h2 className="font-heading mt-2 text-3xl md:text-4xl">
            Schools & learning
          </h2>
          {community.schoolDistrict && (
            <p className="mt-2 text-muted-foreground">
              District: {community.schoolDistrict}
            </p>
          )}
          {community.schoolOverview && (
            <p className="mt-4 max-w-3xl leading-relaxed text-muted-foreground">
              {community.schoolOverview}
            </p>
          )}

          {schools.length > 0 && (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {schools.map((school) => (
                <article
                  key={school.id}
                  className="rounded-xl border border-border/80 bg-background/80 p-5 backdrop-blur-sm transition-colors hover:border-primary/40"
                >
                  <div className="flex items-start gap-3">
                    <GraduationCap className="mt-0.5 size-5 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {schoolTypeLabels[school.type] ?? school.type}
                      </p>
                      <h3 className="font-heading mt-1 text-lg">{school.name}</h3>
                      <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                        {school.rating && (
                          <span className="inline-flex items-center gap-1 text-primary">
                            <Star className="size-3.5 fill-primary" />
                            {school.rating}
                          </span>
                        )}
                        {school.distance && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3.5" />
                            {school.distance}
                          </span>
                        )}
                      </div>
                      {school.notes && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {school.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </FadeInSection>
  );
}
