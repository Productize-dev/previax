"use client";

import { Heart, Play, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRef, useState } from "react";

import { ApartmentCard } from "@/components/apartments/apartment-card";
import { CommunityCard } from "@/components/communities/community-card";
import { YouTubePosterImage } from "@/components/communities/youtube-poster-image";
import { NetflixNavbar } from "@/components/home/netflix-navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  YouTubeEmbed,
  youtubeMute,
  youtubeUnmute,
} from "@/components/video/youtube-embed";
import { useBuyer } from "@/context/buyer-context";
import { useData } from "@/context/data-context";
import { usePrefersCoarsePointer } from "@/hooks/use-prefers-coarse-pointer";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import {
  formatRent,
  getPublicApartmentCommunities,
  getRentRange,
} from "@/lib/apartment-utils";
import { getPublicCommunities } from "@/lib/community-utils";
import { APP_HOME } from "@/lib/routes";
import { cn } from "@/lib/utils";

export default function ApartmentDetailContent() {
  const params = useParams<{ id: string }>();
  const { apartmentCommunities, communities, isLoaded } = useData();
  const { isApartmentSaved, toggleSavedApartment } = useBuyer();
  const coarse = usePrefersCoarsePointer();
  const reduceMotion = usePrefersReducedMotion();
  const [muted, setMuted] = useState(true);
  const [playbackStarted, setPlaybackStarted] = useState(false);
  const videoIframeRef = useRef<HTMLIFrameElement>(null);
  const community = getPublicApartmentCommunities(apartmentCommunities).find(
    (c) => c.id === params.id,
  );

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#141414] text-white">
        <NetflixNavbar />
        <div className="flex min-h-[60svh] items-center justify-center pt-24">
          <p className="text-[#b3b3b3]">Loading...</p>
        </div>
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
  const heroVideoUrl = community.youtubeUrl?.trim() || "";
  const showBackgroundVideo =
    Boolean(heroVideoUrl) && !coarse && !reduceMotion;
  const showPosterUntilPlay =
    Boolean(heroVideoUrl) && (coarse || reduceMotion) && !playbackStarted;

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    if (next) youtubeMute(videoIframeRef.current);
    else youtubeUnmute(videoIframeRef.current);
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <NetflixNavbar />

      <div className="relative min-h-[45svh] overflow-hidden pt-16 md:min-h-[60svh]">
        {heroVideoUrl ? (
          <>
            <YouTubePosterImage
              videoUrl={heroVideoUrl}
              fallbackUrl={community.thumbnailUrl}
              className="absolute inset-0 size-full"
              imgClassName="object-cover"
              loading="eager"
              fetchPriority="high"
            />
            {(showBackgroundVideo || playbackStarted) && (
              <YouTubeEmbed
                youtubeUrl={heroVideoUrl}
                title={community.name}
                preset={playbackStarted && coarse ? "interactive" : "background"}
                autoplay
                mute
                loop={!playbackStarted}
                loading="eager"
                fillContainer
                cover={!playbackStarted || !coarse}
                iframeRef={videoIframeRef}
                className="absolute inset-0 size-full"
              />
            )}
          </>
        ) : community.thumbnailUrl ? (
          <img
            src={community.thumbnailUrl}
            alt=""
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-[#2a2a2a]" />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/40 to-black/50" />

        {showPosterUntilPlay && (
          <button
            type="button"
            onClick={() => {
              setPlaybackStarted(true);
              setMuted(true);
            }}
            className="absolute left-1/2 top-[42%] z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-white px-6 py-3 text-base font-bold text-[#141414] shadow-lg"
            aria-label="Play video"
          >
            <Play className="size-5 fill-current" />
            Play
          </button>
        )}

        {heroVideoUrl && (showBackgroundVideo || playbackStarted) && (
          <button
            type="button"
            onClick={toggleMute}
            className="absolute right-[4%] z-20 inline-flex size-11 items-center justify-center rounded-full border border-white/40 bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70 bottom-[max(5rem,env(safe-area-inset-bottom))]"
            aria-label={muted ? "Unmute video" : "Mute video"}
          >
            {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </button>
        )}

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
                      loading="lazy"
                      decoding="async"
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
                  loading="lazy"
                  decoding="async"
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
