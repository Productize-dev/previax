import {
  HOME_LISTING_CATEGORY_LABELS,
  HOME_LISTING_CATEGORY_STYLES,
} from "@/lib/home-listing-categories";
import type { HomeListingCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

type HomeListingCategoryBadgesProps = {
  categories: HomeListingCategory[];
  max?: number;
  size?: "sm" | "md";
  className?: string;
};

export function HomeListingCategoryBadges({
  categories,
  max = 4,
  size = "sm",
  className,
}: HomeListingCategoryBadgesProps) {
  if (categories.length === 0) return null;

  const visible = categories.slice(0, max);

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {visible.map((category) => (
        <span
          key={category}
          className={cn(
            "inline-flex shrink-0 items-center rounded-[3px] px-1.5 py-0.5 font-bold uppercase leading-none tracking-wide",
            size === "sm" ? "text-[8px] sm:text-[9px]" : "text-[10px] sm:text-[11px]",
            HOME_LISTING_CATEGORY_STYLES[category],
          )}
        >
          {HOME_LISTING_CATEGORY_LABELS[category]}
        </span>
      ))}
    </div>
  );
}
