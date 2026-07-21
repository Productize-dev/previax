"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Info, Play } from "lucide-react";

import { useData } from "@/context/data-context";
import {
  getAvailableHomeCount,
  getPriceRange,
  getPublicCommunities,
  hasActiveOffers,
} from "@/lib/community-utils";
import type { Community } from "@/lib/types";
import { YouTubeEmbed } from "@/components/video/youtube-embed";
import { cn } from "@/lib/utils";

const SLIDE_DURATION_MS = 10_000;
const TRANSITION_MS = 700;
const FOCUS_CROSSFADE_MS = 500;

type NetflixHeroProps = {
  focusCommunity?: Community | null;
};

export function NetflixHero({ focusCommunity = null }: NetflixHeroProps) {
  const { featured, communities: allCommunities, isLoaded } = useData();
  const communities = useMemo(
    () => getPublicCommunities(allCommunities),
    [allCommunities],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [carouselTransitioning, setCarouselTransitioning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [incomingImage, setIncomingImage] = useState<string | null>(null);
  const [incomingVisible, setIncomingVisible] = useState(false);
  const [copyVisible, setCopyVisible] = useState(true);
  const [heroVideoReady, setHeroVideoReady] = useState(false);
  const crossfadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const items = [...featured].sort((a, b) => a.order - b.order);
  const count = items.length;
  const active = items[activeIndex];
  const featuredCommunity = active?.communityId
    ? communities.find((c) => c.id === active.communityId)
    : undefined;

  const isFocused = Boolean(focusCommunity);
  const heroCommunity = focusCommunity ?? featuredCommunity;
  const heroTitle = isFocused
    ? focusCommunity!.name
    : (active?.title ?? focusCommunity?.name ?? "Explore Communities");
  const heroDescription = isFocused
    ? focusCommunity!.description ||
      focusCommunity!.tagline ||
      `${focusCommunity!.builderName} in ${focusCommunity!.city}, NC`
    : (featuredCommunity?.description?.trim() ||
      active?.subtitle ||
      featuredCommunity?.tagline);

  const goTo = useCallback(
    (index: number) => {
      if (count === 0 || index === activeIndex || isFocused) return;
      setCarouselTransitioning(true);
      setTimeout(() => {
        setActiveIndex((index + count) % count);
        setCarouselTransitioning(false);
      }, TRANSITION_MS);
    },
    [activeIndex, count, isFocused],
  );

  const goNext = useCallback(() => {
    goTo((activeIndex + 1) % count);
  }, [activeIndex, count, goTo]);

  useEffect(() => {
    if (count <= 1 || paused || isFocused) return;
    const timer = setInterval(goNext, SLIDE_DURATION_MS);
    return () => clearInterval(timer);
  }, [count, goNext, activeIndex, paused, isFocused]);

  useEffect(() => {
    if (isFocused) {
      setHeroVideoReady(false);
      return;
    }
    setHeroVideoReady(false);
    const timer = setTimeout(() => setHeroVideoReady(true), 900);
    return () => clearTimeout(timer);
  }, [isFocused, activeIndex]);

  useEffect(() => {
    const nextImage = heroCommunity?.thumbnailUrl ?? null;
    if (!nextImage) return;

    if (!heroImage) {
      setHeroImage(nextImage);
      return;
    }

    if (nextImage === heroImage) return;

    if (crossfadeTimerRef.current) clearTimeout(crossfadeTimerRef.current);

    setIncomingImage(nextImage);
    setIncomingVisible(false);
    setCopyVisible(false);

    const revealFrame = requestAnimationFrame(() => {
      setIncomingVisible(true);
    });

    crossfadeTimerRef.current = setTimeout(() => {
      setHeroImage(nextImage);
      setIncomingImage(null);
      setIncomingVisible(false);
      setCopyVisible(true);
    }, FOCUS_CROSSFADE_MS);

    return () => {
      cancelAnimationFrame(revealFrame);
      if (crossfadeTimerRef.current) clearTimeout(crossfadeTimerRef.current);
    };
  }, [heroCommunity?.id, heroCommunity?.thumbnailUrl, heroImage]);

  if (!isLoaded) {
    return (
      <section id="home" className="netflix-billboard flex items-center justify-center">
        <p className="text-[#808080]">Loading...</p>
      </section>
    );
  }

  if (count === 0 && !focusCommunity) {
    return (
      <section id="home" className="netflix-billboard flex items-end pb-24">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
        <div className="relative z-10 max-w-2xl px-[4%] pb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#46d369]">
            Previax Original
          </p>
          <h1 className="netflix-hero-title mt-3 text-3xl sm:text-5xl md:text-6xl">
            Explore North Carolina Communities
          </h1>
          <p className="mt-4 max-w-lg text-sm text-white/90 sm:text-base md:text-lg">
            Discover premium new construction communities with cinematic video
            tours, builder offers, and expert guidance.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/#communities"
              className="inline-flex h-10 items-center gap-2 rounded-[4px] bg-white px-6 text-sm font-bold text-black transition-colors hover:bg-white/80 sm:h-12 sm:text-lg"
            >
              <Play className="size-4 fill-black sm:size-6" />
              Explore
            </Link>
            <Link
              href="/guidance"
              className="inline-flex h-10 items-center gap-2 rounded-[4px] bg-[rgba(109,109,110,0.7)] px-6 text-sm font-bold text-white transition-colors hover:bg-[rgba(109,109,110,0.5)] sm:h-12 sm:text-lg"
            >
              <Info className="size-4 sm:size-5" />
              More Info
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const communityForMedia = heroCommunity;
  const videoUrl = isFocused
    ? communityForMedia?.youtubeUrl
    : (active?.youtubeUrl ?? communityForMedia?.youtubeUrl);
  const priceRange = communityForMedia
    ? getPriceRange(communityForMedia)
    : null;
  const homeCount = communityForMedia
    ? getAvailableHomeCount(communityForMedia)
    : 0;
  const communityId = isFocused
    ? focusCommunity!.id
    : (active?.communityId ?? communityForMedia?.id);
  // Row hover preview uses tile video; hero stays on poster when syncing to a row.
  const showVideo = Boolean(videoUrl && !isFocused && heroVideoReady);

  return (
    <section
      id="home"
      className="netflix-billboard"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="absolute inset-0">
        {showVideo && videoUrl ? (
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-700 ease-in-out",
              carouselTransitioning ? "opacity-0" : "opacity-100",
            )}
          >
            <YouTubeEmbed
              key={`video-${isFocused ? focusCommunity?.id : active?.id}-${activeIndex}`}
              youtubeUrl={videoUrl}
              title={heroTitle}
              preset="background"
              loading="eager"
              fillContainer
              cover
              className="absolute inset-0 size-full"
            />
          </div>
        ) : (
          <>
            {heroImage && (
              <img
                src={heroImage}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            {incomingImage && (
              <img
                src={incomingImage}
                alt=""
                className={cn(
                  "absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-out",
                  incomingVisible ? "opacity-100" : "opacity-0",
                )}
              />
            )}
          </>
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/55 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/35 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/70 to-transparent" />

      <div
        className={cn(
          "relative z-10 flex h-full items-end px-[4%] pb-[18%] sm:pb-[15%] md:pb-[12%]",
          "transition-opacity duration-300 ease-out",
          copyVisible ? "opacity-100" : "opacity-70",
        )}
      >
        <div className="max-w-xl md:max-w-2xl lg:max-w-[42rem]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#46d369] sm:text-sm">
            {isFocused ? "Now Previewing" : "Previax Original"}
          </p>
          <h1 className="netflix-hero-title mt-2 text-3xl leading-[1.05] sm:mt-3 sm:text-5xl md:text-6xl lg:text-7xl">
            {heroTitle}
          </h1>

          {communityForMedia && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {hasActiveOffers(communityForMedia) && (
                <span className="rounded-[2px] bg-[#46d369] px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-black">
                  Offers
                </span>
              )}
              {homeCount > 0 && (
                <span className="rounded-[2px] bg-white/15 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                  {homeCount} home{homeCount !== 1 ? "s" : ""}
                </span>
              )}
              {priceRange && (
                <span className="rounded-[2px] bg-white/15 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                  {priceRange.label}
                </span>
              )}
              <span className="text-sm text-[#bcbcbc]">
                {communityForMedia.city}, NC
              </span>
            </div>
          )}

          {heroDescription && (
            <p className="mt-4 line-clamp-3 max-w-xl text-sm leading-relaxed text-white/95 sm:text-base md:text-lg">
              {heroDescription}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2 sm:mt-6 sm:gap-3">
            {communityId ? (
              <>
                <Link
                  href={`/communities/${communityId}`}
                  className="inline-flex h-10 items-center gap-2 rounded-[4px] bg-white px-5 text-sm font-bold text-black transition-colors hover:bg-white/80 sm:h-12 sm:px-7 sm:text-lg"
                >
                  <Play className="size-5 fill-black sm:size-6" />
                  Play
                </Link>
                <Link
                  href={`/communities/${communityId}?models=1`}
                  className="inline-flex h-10 items-center gap-2 rounded-[4px] bg-[rgba(109,109,110,0.7)] px-5 text-sm font-bold text-white transition-colors hover:bg-[rgba(109,109,110,0.5)] sm:h-12 sm:px-7 sm:text-lg"
                >
                  <Info className="size-5" />
                  More Info
                </Link>
              </>
            ) : (
              <Link
                href="/#communities"
                className="inline-flex h-10 items-center gap-2 rounded-[4px] bg-white px-5 text-sm font-bold text-black transition-colors hover:bg-white/80 sm:h-12 sm:px-7 sm:text-lg"
              >
                <Play className="size-5 fill-black sm:size-6" />
                Explore
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
