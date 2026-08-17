"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ApartmentCard } from "@/components/apartments/apartment-card";
import { NetflixNavbar } from "@/components/home/netflix-navbar";
import { Input } from "@/components/ui/input";
import { useData } from "@/context/data-context";
import { getPublicApartmentCommunities } from "@/lib/apartment-utils";
import { APP_HOME } from "@/lib/routes";

export default function RentBrowseContent() {
  const { apartmentCommunities, isLoaded } = useData();
  const [query, setQuery] = useState("");

  const listings = useMemo(() => {
    const all = getPublicApartmentCommunities(apartmentCommunities);
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        (c.tagline ?? "").toLowerCase().includes(q),
    );
  }, [apartmentCommunities, query]);

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <NetflixNavbar />
      <div className="mx-auto max-w-6xl px-6 pb-10 pt-24">
        <p className="text-sm uppercase tracking-[0.25em] text-primary">
          Relocating
        </p>
        <h1 className="font-heading mt-3 text-4xl md:text-5xl">
          Rent while you relocate
        </h1>
        <p className="mt-3 max-w-2xl text-[#b3b3b3]">
          Short-term-friendly apartments near the communities you&apos;ll tour.
          Settle in first, then buy with Previax.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link href={APP_HOME} className="text-primary hover:underline">
            Browse homes to buy
          </Link>
        </div>

        <div className="mt-8 max-w-md">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by city or name"
            className="border-white/15 bg-white/5 text-white placeholder:text-[#808080]"
          />
        </div>

        {!isLoaded ? (
          <p className="mt-10 text-[#b3b3b3]">Loading rentals...</p>
        ) : listings.length === 0 ? (
          <p className="mt-10 text-[#b3b3b3]">
            No apartment communities yet. Check back soon, or{" "}
            <Link href={APP_HOME} className="text-primary hover:underline">
              browse homes to buy
            </Link>
            .
          </p>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((community) => (
              <ApartmentCard key={community.id} community={community} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
