"use client";

import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatTileProps = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  onClick?: () => void;
  /** Resalta el tile (ej. pendientes > 0). */
  highlight?: boolean;
};

/** KPI compacto y visual: icono + número grande + label corto. */
export function StatTile({
  label,
  value,
  icon: Icon,
  onClick,
  highlight = false,
}: StatTileProps) {
  const card = (
    <Card
      className={cn(
        "h-full transition-colors",
        onClick && "hover:border-primary/60",
        highlight && "border-primary/50 bg-primary/5",
      )}
    >
      <CardContent className="flex items-center gap-4 py-5">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl",
            highlight
              ? "bg-primary text-primary-foreground"
              : "bg-primary/10 text-primary",
          )}
        >
          <Icon className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="block font-heading text-3xl leading-none">
            {value}
          </span>
          <span className="mt-1 block truncate text-xs text-muted-foreground">
            {label}
          </span>
        </span>
      </CardContent>
    </Card>
  );

  if (!onClick) return card;

  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      {card}
    </button>
  );
}
