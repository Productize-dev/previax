"use client";

import { ApartmentCard } from "@/components/apartments/apartment-card";
import { CommunityCard } from "@/components/communities/community-card";
import { NetflixNavbar } from "@/components/home/netflix-navbar";
import { YouTubeEmbed } from "@/components/video/youtube-embed";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useBuyer } from "@/context/buyer-context";
import { useData } from "@/context/data-context";
import {
  formatRent,
  getPublicApartmentCommunities,
  getRentRange,
} from "@/lib/apartment-utils";
import { getPublicCommunities } from "@/lib/community-utils";
import { APP_HOME } from "@/lib/routes";
import { Heart } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";

export default function ApartmentDetailContent() {
  const params = useParams<{ id: string }>();
  const { apartmentCommunities, communities, isLoaded } = useData();
  const { isApartmentSaved, toggleSavedApartment } = useBuyer();
  const community = getPublicApartmentCommunities(apartmentCommunities).find(
    (c) => c.id === params.id,
  );

  if (!isLoaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#141414] text-white">
        <p className="text-[#b3b3b3]">Loading...</p>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-[#141414] text-white">
        <NetflixNavbar />
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h1 className="font-heading text-3xl">Apartment not found</h1>
          <p className="mt-3 text-[#b3b3b3]">
            This rental listing may be hidden or removed.
          </p>
          <Button className="mt-6" render={<Link href="/rent" />} nativeButton={false}>
            Browse rentals
          </Button>
        </div>
      </div>
    );
  }

  const rentRange = getRentRange(community);
  const nearbyBuy = getPublicCommunities(communities).filter(
    (c) => c.city.trim().toLowerCase() === community.city.trim().toLowerCase(),
  );
  const otherRentals = getPublicApartmentCommunities(apartmentCommunities)
    .filter((c) => c.id !== community.id)
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <NetflixNavbar />

      <div className="relative mt-4 min-h-[45vh] overflow-hidden md:min-h-[60vh]">
        {community.youtubeUrl ? (
          <YouTubeEmbed
            youtubeUrl={community.youtubeUrl}
            title={community.name}
            preset="interactive"
            autoplay
            mute={false}
            loading="eager"
            fillContainer
            className="absolute inset-0 size-full [&_iframe]:scale-105"
          />
        ) : community.thumbnailUrl ? (
          <img
            src={community.thumbnailUrl}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-[#2a2a2a]" />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/40 to-black/50" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-6 pb-10 pt-32">
          <p className="text-sm uppercase tracking-[0.25em] text-primary">
            Rent · {community.city}, North Carolina
          </p>
          <h1 className="font-heading mt-3 text-4xl md:text-5xl">
            {community.name}
          </h1>
          {community.tagline && (
            <p className="mt-4 max-w-2xl text-lg text-white/90">
              {community.tagline}
            </p>
          )}
          {rentRange && (
            <p className="font-heading mt-4 text-2xl text-white">
              {rentRange.label}
            </p>
          )}
          <div className="mt-5">
            <Button
              type="button"
              variant="outline"
              className="border-white/30 bg-black/40 text-white hover:bg-black/60"
              onClick={() => toggleSavedApartment(community.id)}
            >
              <Heart
                className={cn(
                  "mr-2 size-4",
                  isApartmentSaved(community.id) && "fill-current text-primary",
                )}
              />
              {isApartmentSaved(community.id) ? "Saved" : "Save"}
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-12 px-6 py-10">
        <section className="max-w-3xl space-y-4">
          <h2 className="font-heading text-2xl">About this rental</h2>
          <p className="whitespace-pre-wrap text-[#e5e5e5]/90">
            {community.description ||
              "A flexible landing spot while you tour homes to buy nearby."}
          </p>
          {(community.amenities?.length ?? 0) > 0 && (
            <ul className="flex flex-wrap gap-2 pt-2">
              {community.amenities!.map((amenity) => (
                <li
                  key={amenity}
                  className="rounded-sm border border-white/15 px-3 py-1 text-sm text-[#b3b3b3]"
                >
                  {amenity}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="font-heading text-2xl">Floor plans</h2>
          {community.floorPlans.length === 0 ? (
            <p className="text-[#b3b3b3]">Floor plans coming soon.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {community.floorPlans.map((plan) => (
                <Card
                  key={plan.id}
                  className="overflow-hidden border-white/10 bg-[#1a1a1a] text-white"
                >
                  {plan.imageUrls[0] && (
                    <img
                      src={plan.imageUrls[0]}
                      alt={plan.name}
                      className="aspect-video w-full object-cover"
                    />
                  )}
                  <CardContent className="space-y-2 pt-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-heading text-xl">{plan.name}</h3>
                      {plan.rent > 0 && (
                        <p className="shrink-0 font-heading text-lg text-primary">
                          {formatRent(plan.rent)}
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-[#b3b3b3]">
                      {plan.bedrooms} bd · {plan.bathrooms} ba ·{" "}
                      {plan.sqft > 0
                        ? `${plan.sqft.toLocaleString()} sqft`
                        : "Sqft TBD"}
                      {plan.status ? ` · ${plan.status}` : ""}
                    </p>
                    {plan.description && (
                      <p className="text-sm text-[#e5e5e5]/85">
                        {plan.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {(community.leasingName ||
          community.leasingEmail ||
          community.leasingPhone) && (
          <Card className="overflow-hidden border-white/10 bg-[#1a1a1a] text-white">
            <CardContent className="flex flex-col gap-5 pt-6 sm:flex-row sm:items-center">
              {community.leasingPhotoUrl ? (
                <img
                  src={community.leasingPhotoUrl}
                  alt={community.leasingName || "Leasing"}
                  className="size-20 rounded-full border-2 border-primary/30 object-cover"
                />
              ) : (
                <div className="flex size-20 items-center justify-center rounded-full bg-white/10 text-lg font-medium">
                  {(community.leasingName || "L").slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <p className="text-xs uppercase tracking-widest text-primary">
                  Leasing
                </p>
                <p className="font-heading mt-1 text-xl">
                  {community.leasingName || "Leasing office"}
                </p>
                <p className="mt-1 text-sm text-[#b3b3b3]">
                  Ask about short-term options while you tour homes to buy.
                </p>
                {community.leasingPhone && (
                  <p className="mt-2 text-sm">{community.leasingPhone}</p>
                )}
              </div>
              {community.leasingEmail && (
                <Button
                  size="lg"
                  render={
                    <a
                      href={`mailto:${community.leasingEmail}?subject=${encodeURIComponent(`Rental inquiry: ${community.name}`)}`}
                    />
                  }
                  nativeButton={false}
                >
                  Contact
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        <section className="space-y-4 border-t border-white/10 pt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-heading text-2xl">Homes to buy nearby</h2>
              <p className="mt-1 text-sm text-[#b3b3b3]">
                New construction in {community.city} — stay here while you shop.
              </p>
            </div>
            <Link
              href={APP_HOME}
              className="text-sm text-primary hover:underline"
            >
              Browse all homes
            </Link>
          </div>
          {nearbyBuy.length === 0 ? (
            <p className="text-[#b3b3b3]">
              No buy communities listed in {community.city} yet. Explore the
              full catalog while you settle in.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {nearbyBuy.slice(0, 6).map((item) => (
                <CommunityCard key={item.id} community={item} />
              ))}
            </div>
          )}
        </section>

        {otherRentals.length > 0 && (
          <section className="space-y-4 border-t border-white/10 pt-10">
            <h2 className="font-heading text-2xl">More rentals</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {otherRentals.map((item) => (
                <ApartmentCard key={item.id} community={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
