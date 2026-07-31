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

  const scrollBy = useCallback((dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * scrollAmount, behavior: "smooth" });
  }, [scrollAmount]);

  return (
    <div className={cn("group/carousel relative", className)}>
      {showArrows && (
        <>
          <button
            type="button"
            aria-label="Scroll previous"
            onClick={() => scrollBy(-1)}
            className="absolute left-2 top-1/2 z-20 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:opacity-90 md:flex lg:left-4"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Scroll next"
            onClick={() => scrollBy(1)}
            className="absolute right-2 top-1/2 z-20 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:opacity-90 md:flex lg:right-4"
          >
            <ChevronRight className="size-5" />
          </button>
        </>
      )}

      <div
        ref={trackRef}
        role="list"
        aria-label={ariaLabel}
        className={cn(
          "flex snap-x snap-mandatory gap-4 overflow-x-auto px-[4%] py-2 pb-4",
          "scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          trackClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
