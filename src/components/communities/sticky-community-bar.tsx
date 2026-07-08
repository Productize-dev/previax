"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { buildContactMailto } from "@/lib/config";
import {
  getAvailableHomeCount,
  getPriceRange,
} from "@/lib/community-utils";
import type { Community } from "@/lib/types";

type StickyCommunityBarProps = {
  community: Community;
};

export function StickyCommunityBar({ community }: StickyCommunityBarProps) {
  const [visible, setVisible] = useState(false);
  const priceRange = getPriceRange(community);
  const homeCount = getAvailableHomeCount(community);
  const mailto = buildContactMailto(community.name, community.realtorName);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 400);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed top-[73px] right-0 left-0 z-40 hidden border-b border-border bg-background/95 backdrop-blur md:block">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
        <div className="min-w-0">
          <p className="truncate font-heading text-sm">{community.name}</p>
          <p className="text-xs text-muted-foreground">
            {priceRange?.label ?? "Pricing TBD"} · {homeCount} homes
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" variant="outline" render={<a href="#homes" />} nativeButton={false}>
            View Homes
          </Button>
          <Button size="sm" render={<a href={mailto} />} nativeButton={false}>
            Contact
          </Button>
        </div>
      </div>
    </div>
  );
}
