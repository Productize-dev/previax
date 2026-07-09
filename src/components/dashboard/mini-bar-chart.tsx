"use client";

type MiniBarChartProps = {
  items: { label: string; value: number }[];
  maxBars?: number;
  className?: string;
};

export function MiniBarChart({
  items,
  maxBars = 5,
  className,
}: MiniBarChartProps) {
  const bars = items.slice(0, maxBars);
  const max = Math.max(...bars.map((b) => b.value), 1);

  if (bars.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No data yet for this period.</p>
    );
  }

  return (
    <div className={className}>
      <div className="flex h-28 items-end gap-2">
        {bars.map((bar) => (
          <div key={bar.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <span className="text-[10px] font-medium text-muted-foreground">
              {bar.value}
            </span>
            <div
              className="w-full rounded-t bg-primary/80 transition-all"
              style={{ height: `${Math.max((bar.value / max) * 100, 8)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        {bars.map((bar) => (
          <p
            key={bar.label}
            className="min-w-0 flex-1 truncate text-center text-[10px] text-muted-foreground"
            title={bar.label}
          >
            {bar.label}
          </p>
        ))}
      </div>
    </div>
  );
}
