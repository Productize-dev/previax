"use client";

import { ArrowDownAZ, ArrowUpAZ, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SortDir = "asc" | "desc";

type ListToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  sortDir: SortDir;
  onSortToggle: () => void;
  count?: number;
};

export function ListToolbar({
  search,
  onSearchChange,
  placeholder = "Search…",
  sortDir,
  onSortToggle,
  count,
}: ListToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onSortToggle}>
        {sortDir === "asc" ? (
          <ArrowDownAZ className="mr-1.5 size-4" />
        ) : (
          <ArrowUpAZ className="mr-1.5 size-4" />
        )}
        {sortDir === "asc" ? "A → Z" : "Z → A"}
      </Button>
      {count !== undefined && (
        <span className="text-xs text-muted-foreground">
          {count} result{count === 1 ? "" : "s"}
        </span>
      )}
    </div>
  );
}

export function filterBySearch<T>(
  items: T[],
  search: string,
  getLabel: (item: T) => string,
): T[] {
  const q = search.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => getLabel(item).toLowerCase().includes(q));
}

export function sortByLabel<T>(
  items: T[],
  getLabel: (item: T) => string,
  dir: SortDir,
): T[] {
  return [...items].sort((a, b) => {
    const cmp = getLabel(a).localeCompare(getLabel(b), undefined, {
      sensitivity: "base",
    });
    return dir === "asc" ? cmp : -cmp;
  });
}
