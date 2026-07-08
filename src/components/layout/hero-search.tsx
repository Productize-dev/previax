"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useBuyer } from "@/context/buyer-context";
import { cn } from "@/lib/utils";

type HeroSearchProps = {
  className?: string;
  onSubmit?: () => void;
};

export function HeroSearch({ className, onSubmit }: HeroSearchProps) {
  const { searchQuery, setSearchQuery } = useBuyer();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    document.getElementById("communities")?.scrollIntoView({ behavior: "smooth" });
    onSubmit?.();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex w-full max-w-2xl overflow-hidden rounded-full border border-white/20 bg-white/95 text-zinc-900 shadow-2xl backdrop-blur-md",
        className,
      )}
    >
      <div className="relative flex-1">
        <Search className="absolute top-1/2 left-5 size-5 -translate-y-1/2 text-zinc-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search communities, cities, builders..."
          className="h-14 rounded-none border-0 bg-transparent pl-12 text-base text-zinc-900 shadow-none placeholder:text-zinc-400 focus-visible:ring-0"
        />
      </div>
      <button
        type="submit"
        className="shrink-0 bg-primary px-8 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Search
      </button>
    </form>
  );
}
