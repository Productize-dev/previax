"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  onScrollLeft?: () => void;
  onScrollRight?: () => void;
  align?: "left" | "center";
  size?: "default" | "compact";
  className?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  onScrollLeft,
  onScrollRight,
  align = "left",
  size = "default",
  className,
}: SectionHeaderProps) {
  const showArrows = onScrollLeft && onScrollRight;
  const centered = align === "center";
  const compact = size === "compact";

  return (
    <div
      className={cn(
        compact ? "mb-4 gap-3" : "mb-6 gap-4",
        centered
          ? "flex flex-col items-center text-center"
          : "flex items-end justify-between",
        className,
      )}
    >
      <div className={cn(centered && "max-w-2xl")}>
        {eyebrow && <p className="section-eyebrow">{eyebrow}</p>}
        <h2
          className={cn(
            "font-heading",
            compact
              ? "text-lg font-semibold md:text-xl"
              : centered
                ? "mt-3 text-3xl md:text-4xl"
                : "text-2xl md:text-3xl",
          )}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className={cn(
              "text-muted-foreground",
              centered
                ? "mt-4 text-base leading-relaxed md:text-lg"
                : "mt-1 text-sm",
            )}
          >
            {subtitle}
          </p>
        )}
      </div>
      {showArrows && !centered && (
        <div className="hidden shrink-0 gap-2 sm:flex">
          <button
            type="button"
            onClick={onScrollLeft}
            className="flex size-9 items-center justify-center rounded-full border border-border bg-card transition-colors hover:border-primary/50 hover:bg-muted"
            aria-label="Scroll left"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={onScrollRight}
            className="flex size-9 items-center justify-center rounded-full border border-border bg-card transition-colors hover:border-primary/50 hover:bg-muted"
            aria-label="Scroll right"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export const ScrollRow = forwardRef<
  HTMLDivElement,
  { children: React.ReactNode; className?: string }
>(function ScrollRow({ children, className }, ref) {
  return (
    <div ref={ref} className={cn("netflix-row", className)}>
      {children}
    </div>
  );
});
