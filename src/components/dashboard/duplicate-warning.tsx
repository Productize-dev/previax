"use client";

import { AlertTriangle } from "lucide-react";

import type { DuplicateMatch } from "@/lib/duplicate-detection";

type DuplicateWarningProps = {
  matches: DuplicateMatch[];
};

export function DuplicateWarning({ matches }: DuplicateWarningProps) {
  if (matches.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
      <div className="mb-2 flex items-center gap-2 font-medium text-amber-700 dark:text-amber-300">
        <AlertTriangle className="size-4 shrink-0" />
        Similar listing{matches.length === 1 ? "" : "s"} found
      </div>
      <ul className="space-y-1 text-muted-foreground">
        {matches.map((m) => (
          <li key={m.id}>
            <span className="text-foreground">{m.name}</span> — {m.city}
            <span className="ml-2 text-xs">({m.reason})</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">
        You can still save — this is only a warning.
      </p>
    </div>
  );
}
