"use client";

import Link from "next/link";
import { useMemo } from "react";

import { HomesScrollSection } from "@/components/homes/homes-scroll-section";
import { FadeInSection } from "@/components/ui/fade-in-section";
import { SectionHeader } from "@/components/ui/section-header";
import { useData } from "@/context/data-context";

export function CommunityHomesSection({
  community,
}: {
  community: import("@/lib/types").Community;
}) {
  const listings = useMemo(
    () =>
      community.homes
        .filter((h) => h.status !== "sold")
        .map((home) => ({
          home,
          communityId: community.id,
          communityName: community.name,
          city: community.city,
        })),
    [community],
  );

  if (listings.length === 0) return null;

  return (
    <HomesScrollSection
      id="homes"
      eyebrow="Homes"
      title={`Houses in ${community.name}`}
      listings={listings}
      showFilters
      showCommunityMeta={false}
    />
  );
}

export function HomepageHomesRow() {
  const { communities, homepageHomes, isLoaded } = useData();

  const rows = useMemo(() => {
    return [...homepageHomes]
      .sort((a, b) => a.order - b.order)
      .map((row) => {
        const community = communities.find((c) => c.id === row.communityId);
        if (!community) return null;
        const listings = community.homes
          .filter((h) => h.status !== "sold")
          .map((home) => ({
            home,
            communityId: community.id,
            communityName: community.name,
            city: community.city,
          }));
        if (listings.length === 0) return null;
        return { row, community, listings };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [communities, homepageHomes]);

  if (!isLoaded || rows.length === 0) return null;

  return (
    <FadeInSection>
      <section id="homes" className="border-t border-border/50 py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader
            eyebrow="Listings"
            title="Homes by community"
            subtitle={`Browse floor plans across ${rows.length} communit${rows.length === 1 ? "y" : "ies"}`}
          />

          <div className="space-y-14">
            {rows.map(({ row, community, listings }) => (
              <div key={row.id}>
                <HomesScrollSection
                  title={community.name}
                  listings={listings}
                  showFilters={false}
                  showCommunityMeta={false}
                  hideSubtitle
                  headerSize="compact"
                  bleed
                />
                <Link
                  href={`/communities/${community.id}#homes`}
                  className="mt-3 inline-block text-sm text-primary hover:underline"
                >
                  View all in {community.name} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </FadeInSection>
  );
}
