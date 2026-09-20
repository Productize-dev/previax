"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { RefObject } from "react";

import { cn } from "@/lib/utils";

type NetflixRowChevronsProps = {
  trackRef: RefObject<HTMLDivElement | null>;
  className?: string;
};

/** Side arrows for horizontal Netflix rows — visible on row hover (desktop). */
export function NetflixRowChevrons({
  trackRef,
  className,
}: NetflixRowChevronsProps) {
  function scroll(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    const amount = Math.max(track.clientWidth * 0.85, 280);
    track.scrollBy({ left: direction * amount, behavior: "smooth" });
  }

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-y-0 left-0 right-0 z-30 hidden md:block",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Scroll left"
        onClick={() => scroll(-1)}
        className="netflix-row-chevron netflix-row-chevron--left pointer-events-auto"
      >
        <ChevronLeft className="size-8" strokeWidth={1.75} />
      </button>
      <button
        type="button"
        aria-label="Scroll right"
        onClick={() => scroll(1)}
        className="netflix-row-chevron netflix-row-chevron--right pointer-events-auto"
      >
        <ChevronRight className="size-8" strokeWidth={1.75} />
      </button>
    </div>
  );
}
