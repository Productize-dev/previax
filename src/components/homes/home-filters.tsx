"use client";

import { useEffect, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  filterHomesByBeds,
  sortHomes,
} from "@/lib/community-utils";
import type { Home } from "@/lib/types";

type HomeFiltersProps = {
  homes: Home[];
  onFiltered: (homes: Home[]) => void;
};

export function HomeFilters({ homes, onFiltered }: HomeFiltersProps) {
  const [sort, setSort] = useState<"price-asc" | "price-desc" | "beds-desc">(
    "price-asc",
  );
  const [beds, setBeds] = useState("all");

  useEffect(() => {
    let result = filterHomesByBeds(homes, beds === "all" ? null : Number(beds));
    result = sortHomes(result, sort);
    onFiltered(result);
  }, [homes, sort, beds, onFiltered]);

  return (
    <div className="mb-6 flex flex-wrap gap-3">
      <Select
        value={sort}
        onValueChange={(v) => setSort((v ?? "price-asc") as typeof sort)}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="price-asc">Price: Low to High</SelectItem>
          <SelectItem value="price-desc">Price: High to Low</SelectItem>
          <SelectItem value="beds-desc">Most bedrooms</SelectItem>
        </SelectContent>
      </Select>
      <Select value={beds} onValueChange={(v) => setBeds(v ?? "all")}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Bedrooms" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All beds</SelectItem>
          <SelectItem value="3">3+ beds</SelectItem>
          <SelectItem value="4">4+ beds</SelectItem>
          <SelectItem value="5">5+ beds</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
