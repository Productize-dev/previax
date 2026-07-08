"use client";

import { buildContactMailto } from "@/lib/config";
import { getPriceRange } from "@/lib/community-utils";
import { getCommunityBuilderDisplay } from "@/lib/community-builders";
import type { Community } from "@/lib/types";

import { Button } from "@/components/ui/button";

type MobileStickyBarProps = {
  community: Community;
};

export function MobileStickyBar({ community }: MobileStickyBarProps) {
  const mailto = buildContactMailto(community.name, community.realtorName);

  return (
    <div className="fixed right-0 bottom-0 left-0 z-40 border-t border-border bg-background/95 p-4 backdrop-blur md:hidden">
      <Button className="w-full" render={<a href={mailto} />} nativeButton={false}>
        Contact
      </Button>
    </div>
  );
}

export function CommunityStats({ community }: { community: Community }) {
  const priceRange = getPriceRange(community);
  const builderLabel = getCommunityBuilderDisplay(community);

  const stats = [
    { label: "Price range", value: priceRange?.label ?? "—" },
    {
      label: community.isMultiBuilder ? "Builders" : "Builder",
      value: builderLabel,
    },
    { label: "Location", value: `${community.city}, NC` },
  ];

  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
      {stats.map(({ label, value }) => (
        <div key={label} className="bg-card px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-1.5 font-heading text-lg leading-tight">{value}</p>
        </div>
      ))}
    </div>
  );
}
