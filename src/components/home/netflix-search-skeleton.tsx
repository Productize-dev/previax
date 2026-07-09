"use client";

import { cn } from "@/lib/utils";

type NetflixSearchSkeletonProps = {
  rows?: number;
  className?: string;
};

export function NetflixSearchSkeleton({
  rows = 3,
  className,
}: NetflixSearchSkeletonProps) {
  return (
    <div className={cn("space-y-8 px-[4%] py-6", className)}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="space-y-3">
          <div className="h-5 w-40 animate-pulse rounded bg-white/10" />
          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: 6 }).map((__, tileIndex) => (
              <div
                key={tileIndex}
                className="aspect-video w-[28vw] max-w-[280px] shrink-0 animate-pulse rounded bg-white/10"
                style={{ animationDelay: `${tileIndex * 80}ms` }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
