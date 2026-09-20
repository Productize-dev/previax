"use client";

import { useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

type LandingCarouselProps = {
  children: React.ReactNode;
  className?: string;
  trackClassName?: string;
  /** Approx tile width for arrow scroll distance. */
  scrollAmount?: number;
  showArrows?: boolean;
  "aria-label"?: string;
};

export function LandingCarousel({
  children,
  className,
  trackClassName,
  scrollAmount = 420,
  showArrows = true,
  "aria-label": ariaLabel,
}: LandingCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollBy = useCallback(
    (dir: -1 | 1) => {
      const el = trackRef.current;
      if (!el) return;
      const amount = Math.max(el.clientWidth * 0.85, scrollAmount);
      el.scrollBy({ left: dir * amount, behavior: "smooth" });
    },
    [scrollAmount],
  );

  return (
    <div className={cn("group/carousel relative", className)}>
      {showArrows && (
        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-30 hidden md:block">
          <button
            type="button"
            aria-label="Scroll previous"
            onClick={() => scrollBy(-1)}
            className="landing-row-chevron landing-row-chevron--left pointer-events-auto"
          >
            <ChevronLeft className="size-8" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            aria-label="Scroll next"
            onClick={() => scrollBy(1)}
            className="landing-row-chevron landing-row-chevron--right pointer-events-auto"
          >
            <ChevronRight className="size-8" strokeWidth={1.75} />
          </button>
        </div>
      )}

      <div
        ref={trackRef}
        role="list"
        aria-label={ariaLabel}
        className={cn(
          "flex snap-x snap-mandatory gap-3 overflow-x-auto px-[4%] py-2 pb-6 sm:gap-4",
          "scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          trackClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
