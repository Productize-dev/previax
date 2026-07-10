"use client";

import { Heart, ThumbsUp } from "lucide-react";

import { useBuyer } from "@/context/buyer-context";
import { homeRef } from "@/lib/buyer-home-ref";
import { cn } from "@/lib/utils";

type TileActionBarProps = {
  communityId?: string;
  homeId?: string;
  homeCommunityId?: string;
  className?: string;
  variant?: "dark" | "light";
};

export function TileActionBar({
  communityId,
  homeId,
  homeCommunityId,
  className,
  variant = "dark",
}: TileActionBarProps) {
  const {
    savedIds,
    savedHomeRefs,
    likedCommunityIds,
    likedHomeRefs,
    toggleSaved,
    toggleSavedHome,
    toggleLikedCommunity,
    toggleLikedHome,
  } = useBuyer();

  const isHome = Boolean(homeId && homeCommunityId);
  const saved = isHome
    ? savedHomeRefs.includes(homeRef(homeCommunityId!, homeId!))
    : communityId
      ? savedIds.includes(communityId)
      : false;
  const liked = isHome
    ? likedHomeRefs.includes(homeRef(homeCommunityId!, homeId!))
    : communityId
      ? likedCommunityIds.includes(communityId)
      : false;

  const btnClass =
    variant === "dark"
      ? "border-white/30 bg-black/60 text-white hover:bg-black/80"
      : "border-border/50 bg-background/80 hover:border-primary/50";

  return (
    <div
      className={cn("flex items-center gap-1.5", className)}
      onClick={(e) => e.preventDefault()}
    >
      <button
        type="button"
        aria-label={saved ? "Remove from My List" : "Add to My List"}
        onClick={(e) => {
          e.stopPropagation();
          if (isHome && homeId && homeCommunityId) {
            toggleSavedHome(homeCommunityId, homeId);
          } else if (communityId) {
            toggleSaved(communityId);
          }
        }}
        className={cn(
          "flex size-8 items-center justify-center rounded-full border backdrop-blur transition-all hover:scale-105",
          btnClass,
          saved && "border-[#e50914] bg-[#e50914]/90 text-white",
        )}
      >
        <Heart className={cn("size-3.5", saved && "fill-current")} />
      </button>
      <button
        type="button"
        aria-label={liked ? "Unlike" : "Like"}
        onClick={(e) => {
          e.stopPropagation();
          if (isHome && homeId && homeCommunityId) {
            toggleLikedHome(homeCommunityId, homeId);
          } else if (communityId) {
            toggleLikedCommunity(communityId);
          }
        }}
        className={cn(
          "flex size-8 items-center justify-center rounded-full border backdrop-blur transition-all hover:scale-105",
          btnClass,
          liked && "border-white bg-white/20 text-white",
        )}
      >
        <ThumbsUp className={cn("size-3.5", liked && "fill-current")} />
      </button>
    </div>
  );
}
