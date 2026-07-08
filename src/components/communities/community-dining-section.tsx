"use client";

import { MapPin, UtensilsCrossed } from "lucide-react";

import { FadeInSection } from "@/components/ui/fade-in-section";
import type { Community, NearbyPlace } from "@/lib/types";

const categoryLabels: Record<string, string> = {
  restaurant: "Restaurant",
  cafe: "Café",
  grocery: "Grocery",
  entertainment: "Entertainment",
  park: "Park & outdoors",
  other: "Nearby",
};

type CommunityDiningSectionProps = {
  community: Community;
};

function PlaceCard({ place }: { place: NearbyPlace }) {
  return (
    <article className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
      {place.imageUrl ? (
        <div className="aspect-[16/10] overflow-hidden">
          <img
            src={place.imageUrl}
            alt={place.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="flex aspect-[16/10] items-center justify-center bg-muted/50">
          <UtensilsCrossed className="size-8 text-muted-foreground/50" />
        </div>
      )}
      <div className="p-4">
        <p className="text-xs uppercase tracking-wide text-primary">
          {categoryLabels[place.category] ?? place.category}
          {place.cuisine ? ` · ${place.cuisine}` : ""}
        </p>
        <h3 className="font-heading mt-1 text-lg">{place.name}</h3>
        {place.distance && (
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5" />
            {place.distance}
          </p>
        )}
        {place.description && (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {place.description}
          </p>
        )}
      </div>
    </article>
  );
}

export function CommunityDiningSection({ community }: CommunityDiningSectionProps) {
  const places = community.nearbyPlaces ?? [];
  const hasContent = places.length > 0 || community.diningOverview;

  if (!hasContent) return null;

  const foodPlaces = places.filter((p) =>
    ["restaurant", "cafe"].includes(p.category),
  );
  const otherPlaces = places.filter(
    (p) => !["restaurant", "cafe"].includes(p.category),
  );

  return (
    <FadeInSection>
      <section>
        <p className="section-eyebrow">Local flavor</p>
        <h2 className="font-heading mt-2 text-3xl md:text-4xl">
          Food & nearby
        </h2>
        {community.diningOverview && (
          <p className="mt-4 max-w-3xl leading-relaxed text-muted-foreground">
            {community.diningOverview}
          </p>
        )}

        {foodPlaces.length > 0 && (
          <div className="mt-8">
            <h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Restaurants & cafés
            </h3>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {foodPlaces.map((place) => (
                <PlaceCard key={place.id} place={place} />
              ))}
            </div>
          </div>
        )}

        {otherPlaces.length > 0 && (
          <div className="mt-10">
            <h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Groceries, parks & more
            </h3>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {otherPlaces.map((place) => (
                <PlaceCard key={place.id} place={place} />
              ))}
            </div>
          </div>
        )}
      </section>
    </FadeInSection>
  );
}
