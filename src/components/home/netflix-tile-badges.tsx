import { cn } from "@/lib/utils";
import type { TileBadge } from "@/lib/netflix-tile-badges";

type NetflixTileBadgesProps = {
  badges: TileBadge[];
  compact?: boolean;
  className?: string;
};

const TONE_CLASS: Record<TileBadge["tone"], string> = {
  top10: "bg-[#e50914] text-white",
  offer: "bg-[#46d369] text-black",
  new: "bg-white text-black",
  brand: "bg-black/70 text-white ring-1 ring-white/25",
  tag: "bg-[rgba(109,109,110,0.85)] text-white",
  status: "bg-[rgba(109,109,110,0.85)] text-white",
};

export function NetflixTileBadges({
  badges,
  compact = false,
  className,
}: NetflixTileBadgesProps) {
  if (badges.length === 0) return null;

  const visible = compact ? badges.slice(0, 3) : badges.slice(0, 4);

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-wrap gap-1 p-1.5 sm:p-2",
        className,
      )}
    >
      {visible.map((badge) => (
        <span
          key={badge.id}
          className={cn(
            "rounded-[2px] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:text-[11px]",
            TONE_CLASS[badge.tone],
          )}
        >
          {badge.label}
        </span>
      ))}
    </div>
  );
}

type NetflixRankMarkProps = {
  rank: number;
  className?: string;
};

/** Large Netflix-style rank numeral beside Top 10 tiles. */
export function NetflixRankMark({ rank, className }: NetflixRankMarkProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute bottom-0 left-0 z-[5] select-none font-sans text-[5.5rem] font-black leading-none tracking-tighter sm:text-[6.5rem] md:text-[7.5rem]",
        className,
      )}
      style={{
        WebkitTextStroke: "3px #b3b3b3",
        color: "#000",
        transform: "translate(-22%, 10%)",
      }}
    >
      {rank}
    </span>
  );
}

type NetflixStatusBarProps = {
  label: string;
  className?: string;
};

export function NetflixStatusBar({ label, className }: NetflixStatusBarProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-[#e50914] px-2 py-1 text-center text-[10px] font-bold uppercase tracking-wide text-white sm:text-[11px]",
        className,
      )}
    >
      {label}
    </div>
  );
}
