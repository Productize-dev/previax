"use client";

import { Heart } from "lucide-react";

import { cn } from "@/lib/utils";
import { useBuyer } from "@/context/buyer-context";

type SaveButtonProps = {
  communityId: string;
  className?: string;
};

export function SaveButton({ communityId, className }: SaveButtonProps) {
  const { savedIds, toggleSaved } = useBuyer();
  const saved = savedIds.includes(communityId);

  return (
    <button
      type="button"
      aria-label={saved ? "Remove from saved" : "Save community"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSaved(communityId);
      }}
      className={cn(
        "flex size-9 items-center justify-center rounded-full border border-border/50 bg-background/80 backdrop-blur transition-colors hover:border-primary/50",
        saved && "border-primary bg-primary/10 text-primary",
        className,
      )}
    >
      <Heart className={cn("size-4", saved && "fill-current")} />
    </button>
  );
}
