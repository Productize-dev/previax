"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Info,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";

import {
  YouTubeEmbed,
  youtubeMute,
  youtubeUnmute,
} from "@/components/video/youtube-embed";
import { useData } from "@/context/data-context";
import { usePrefersCoarsePointer } from "@/hooks/use-prefers-coarse-pointer";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import {
  getAvailableHomeCount,
  getPriceRange,
  getPublicCommunities,
  hasActiveOffers,
} from "@/lib/community-utils";
import { NAV_COMMUNITIES_ID } from "@/lib/homepage-nav";
import { appHash } from "@/lib/routes";
import type { Community } from "@/lib/types";
import { cn } from "@/lib/utils";

const SLIDE_DURATION_MS = 10_000;
const TRANSITION_MS = 900;
const FOCUS_CROSSFADE_MS = 650;

type NetflixHeroProps = {
  focusCommunity?: Community | null;
};

export function NetflixHero({ focusCommunity = null }: NetflixHeroProps) {
  const { featured, communities: allCommunities, isLoaded } = useData();
  const coarse = usePrefersCoarsePointer();
  const reduceMotion = usePrefersReducedMotion();
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
  const [muted, setMuted] = useState(true);
  const videoIframeRef = useRef<HTMLIFrameElement>(null);
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
      setMuted(true);
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

  const goPrev = useCallback(() => {
    goTo((activeIndex - 1 + count) % count);
  }, [activeIndex, count, goTo]);

  useEffect(() => {
    if (count <= 1 || paused || isFocused) return;
    const timer = setInterval(goNext, SLIDE_DURATION_MS);
    return () => clearInterval(timer);
  }, [count, goNext, activeIndex, paused, isFocused]);

  useEffect(() => {
    if (isFocused || coarse || reduceMotion) {
      setHeroVideoReady(false);
      return;
    }
    setHeroVideoReady(false);
    setMuted(true);
    const timer = setTimeout(() => setHeroVideoReady(true), 900);
    return () => clearTimeout(timer);
  }, [isFocused, activeIndex, coarse, reduceMotion]);

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

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    if (next) youtubeMute(videoIframeRef.current);
    else youtubeUnmute(videoIframeRef.current);
  }

  if (!isLoaded) {
    return (
      <section
        id="home"
        className="netflix-billboard flex items-center justify-center"
      >
        <p className="text-[#808080]">Loading...</p>
      </section>
    );
  }

  if (count === 0 && !focusCommunity) {
    return (
      <section id="home" className="netflix-billboard flex items-end">
        <div className="netflix-billboard-vignette" />
        <div className="relative z-10 max-w-2xl px-[4%] pb-[22%] sm:pb-[18%] md:pb-[14%]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70 sm:text-xs">
            Featured
          </p>
          <h1 className="netflix-hero-title mt-3 text-3xl sm:text-5xl md:text-6xl">
            Explore North Carolina Communities
          </h1>
          <p className="mt-4 max-w-lg text-sm text-white/90 sm:text-base md:text-[1.05rem]">
            Discover premium new construction communities with cinematic video
            tours, builder offers, and expert guidance.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={appHash(NAV_COMMUNITIES_ID)}
              className="inline-flex h-10 items-center gap-2 rounded-[4px] bg-white px-5 text-sm font-bold text-black transition-colors hover:bg-white/85 sm:h-11 sm:px-6 sm:text-base"
            >
              <Play className="size-4 fill-black sm:size-5" />
              Explore
            </Link>
            <Link
              href="/guidance"
              className="inline-flex h-10 items-center gap-2 rounded-[4px] bg-[rgba(109,109,110,0.7)] px-5 text-sm font-bold text-white transition-colors hover:bg-[rgba(109,109,110,0.5)] sm:h-11 sm:px-6 sm:text-base"
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
  const saveData =
    typeof navigator !== "undefined" &&
    Boolean(
      (navigator as Navigator & { connection?: { saveData?: boolean } })
        .connection?.saveData,
    );
  const showVideo = Boolean(
    videoUrl &&
      !isFocused &&
      heroVideoReady &&
      !coarse &&
      !reduceMotion &&
      !saveData,
  );

  return (
    <section
      id="home"
      className="netflix-billboard group/hero"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="absolute inset-0">
        {showVideo && videoUrl ? (
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-[900ms] ease-in-out",
              carouselTransitioning ? "opacity-0" : "opacity-100",
            )}
          >
            <YouTubeEmbed
              key={`video-${isFocused ? focusCommunity?.id : active?.id}-${activeIndex}`}
              youtubeUrl={videoUrl}
              title={heroTitle}
              preset="background"
              autoplay
              mute
              loop
              loading="eager"
              fillContainer
              cover
              iframeRef={videoIframeRef}
              className="absolute inset-0 size-full"
            />
          </div>
        ) : null}

        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-[900ms] ease-in-out",
            showVideo && !carouselTransitioning ? "opacity-0" : "opacity-100",
          )}
        >
          {heroImage && (
            <img
              src={heroImage}
              alt=""
              fetchPriority="high"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          {incomingImage && (
            <img
              src={incomingImage}
              alt=""
              decoding="async"
              className={cn(
                "absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out",
                incomingVisible ? "opacity-100" : "opacity-0",
              )}
            />
          )}
        </div>
      </div>

      <div className="netflix-billboard-vignette" />

      <div
        className={cn(
          "relative z-10 flex h-full items-end px-[4%] pb-[24%] sm:pb-[20%] md:pb-[16%] lg:pb-[14%]",
          "transition-opacity duration-500 ease-out",
          copyVisible ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="max-w-xl pt-20 md:max-w-2xl lg:max-w-[38rem]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70 sm:text-xs">
            {isFocused ? "Now Previewing" : "Featured Community"}
          </p>
          <h1 className="netflix-hero-title mt-2 text-3xl leading-[1.05] sm:mt-3 sm:text-5xl md:text-6xl lg:text-[4.5rem]">
            {heroTitle}
          </h1>

          {communityForMedia && (
            <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#b3b3b3] sm:text-[0.95rem]">
              <span>Community</span>
              <span className="text-white/35" aria-hidden>
                •
              </span>
              <span>{communityForMedia.city}, NC</span>
              {homeCount > 0 && (
                <>
                  <span className="text-white/35" aria-hidden>
                    •
                  </span>
                  <span>
                    {homeCount} home{homeCount !== 1 ? "s" : ""}
                  </span>
                </>
              )}
              {priceRange && (
                <>
                  <span className="text-white/35" aria-hidden>
                    •
                  </span>
                  <span>{priceRange.label}</span>
                </>
              )}
              {hasActiveOffers(communityForMedia) && (
                <>
                  <span className="text-white/35" aria-hidden>
                    •
                  </span>
                  <span className="font-semibold text-[#46d369]">Offers</span>
                </>
              )}
            </p>
          )}

          {heroDescription && (
            <p className="mt-4 line-clamp-2 max-w-lg text-sm leading-relaxed text-white/90 sm:text-base md:line-clamp-3 md:text-[1.05rem]">
              {heroDescription}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2 sm:mt-6 sm:gap-3">
            {communityId ? (
              <>
                <Link
                  href={`/communities/${communityId}`}
                  className="inline-flex h-10 items-center gap-2 rounded-[4px] bg-white px-5 text-sm font-bold text-black transition-colors hover:bg-white/85 sm:h-11 sm:px-6 sm:text-base"
                >
                  <Play className="size-5 fill-black sm:size-[1.35rem]" />
                  Play
                </Link>
                <Link
                  href={`/communities/${communityId}?models=1`}
                  className="inline-flex h-10 items-center gap-2 rounded-[4px] bg-[rgba(109,109,110,0.7)] px-5 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-[rgba(109,109,110,0.5)] sm:h-11 sm:px-6 sm:text-base"
                >
                  <Info className="size-5" />
                  More Info
                </Link>
              </>
            ) : (
              <Link
                href={appHash(NAV_COMMUNITIES_ID)}
                className="inline-flex h-10 items-center gap-2 rounded-[4px] bg-white px-5 text-sm font-bold text-black transition-colors hover:bg-white/85 sm:h-11 sm:px-6 sm:text-base"
              >
                <Play className="size-5 fill-black sm:size-[1.35rem]" />
                Explore
              </Link>
            )}
          </div>
        </div>
      </div>

      {!isFocused && count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous featured"
            onClick={goPrev}
            className="netflix-hero-nav netflix-hero-nav--prev"
          >
            <ChevronLeft className="size-8" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            aria-label="Next featured"
            onClick={goNext}
            className="netflix-hero-nav netflix-hero-nav--next"
          >
            <ChevronRight className="size-8" strokeWidth={1.5} />
          </button>
        </>
      )}

      <div className="absolute bottom-[max(6.5rem,16%)] right-[4%] z-20 flex flex-col items-end gap-3">
        {showVideo && (
          <button
            type="button"
            onClick={toggleMute}
            className="inline-flex size-10 items-center justify-center rounded-full border border-white/50 bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/65 sm:size-11"
            aria-label={muted ? "Unmute video" : "Mute video"}
          >
            {muted ? (
              <VolumeX className="size-5" />
            ) : (
              <Volume2 className="size-5" />
            )}
          </button>
        )}

        {!isFocused && count > 1 && (
          <div
            className="flex items-center gap-1.5"
            role="tablist"
            aria-label="Featured slides"
          >
            {items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`Show featured ${index + 1}`}
                onClick={() => goTo(index)}
                className={cn(
                  "h-0.5 rounded-full transition-all duration-300",
                  index === activeIndex
                    ? "w-5 bg-white"
                    : "w-3 bg-white/35 hover:bg-white/60",
                )}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
