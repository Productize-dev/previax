"use client";

import { TileActionBar } from "@/components/home/tile-action-bar";
import { cn } from "@/lib/utils";

type BuyerActionButtonsProps = {
  communityId?: string;
  homeId?: string;
  homeCommunityId?: string;
  className?: string;
  variant?: "dark" | "light";
};

export function BuyerActionButtons({
  communityId,
  homeId,
  homeCommunityId,
  className,
  variant = "light",
}: BuyerActionButtonsProps) {
  return (
    <TileActionBar
      communityId={communityId}
      homeId={homeId}
      homeCommunityId={homeCommunityId}
      variant={variant}
      className={cn(className)}
    />
  );
}
