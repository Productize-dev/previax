"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { Play } from "lucide-react";

import { LandingCarousel } from "@/components/landing/landing-carousel";
import { FadeInSection } from "@/components/ui/fade-in-section";
import { useData } from "@/context/data-context";
import { getCommunityHeroPosterUrl } from "@/lib/community-media";
import { getMarketingBuilders } from "@/lib/community-builders";
import { getPublicCommunities } from "@/lib/community-utils";
import { PARTNER_PATH } from "@/lib/routes";
import type { Builder, Community } from "@/lib/types";
import { getYouTubeThumbnailUrl, isValidYouTubeUrl } from "@/lib/youtube";
import { cn } from "@/lib/utils";

function communityForBuilder(
  builder: Builder,
  communities: Community[],
): Community | undefined {
  return communities.find(
    (c) =>
      c.builderId === builder.id ||
      c.builderIds?.includes(builder.id) ||
      c.builderName.toLowerCase() === builder.name.toLowerCase(),
  );
}

function builderPoster(
  builder: Builder,
  community: Community | undefined,
): string | null {
  if (builder.youtubeUrl?.trim() && isValidYouTubeUrl(builder.youtubeUrl)) {
    return (
      getYouTubeThumbnailUrl(builder.youtubeUrl, "maxres") ||
      getYouTubeThumbnailUrl(builder.youtubeUrl, "hq")
    );
  }
  if (community) return getCommunityHeroPosterUrl(community);
  return null;
}

export function LandingMeetBuilders() {
  const { builders, communities } = useData();

  const cards = useMemo(() => {
    const visible = getPublicCommunities(communities);
    return getMarketingBuilders(builders).map((builder) => ({
      builder,
      community: communityForBuilder(builder, visible),
    }));
  }, [builders, communities]);

  if (cards.length === 0) return null;

  return (
    <FadeInSection>
      <section
        id="builders"
        className="scroll-mt-24 bg-black py-10 md:py-14"
      >
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4 px-[4%] md:mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              Partners
            </p>
            <h2 className="font-heading mt-2 text-3xl text-white sm:text-4xl">
              Meet the Builders
            </h2>
          </div>
          <Link
            href={PARTNER_PATH}
            className="text-sm font-medium text-white/55 transition-colors hover:text-primary"
          >
            Become a partner →
          </Link>
        </div>

        <LandingCarousel aria-label="Builders" scrollAmount={440}>
          {cards.map(({ builder, community }, index) => {
            const poster = builderPoster(builder, community);
            const hasVideo =
              Boolean(builder.youtubeUrl?.trim()) &&
              isValidYouTubeUrl(builder.youtubeUrl!);
            const href = community
              ? `/communities/${community.id}`
              : PARTNER_PATH;
            const ribbon =
              index === 0
                ? {
                    label: "Featured",
                    className: "bg-primary text-primary-foreground",
                  }
                : index === 1
                  ? {
                      label: "Exclusive",
                      className: "bg-[#7a1f2b] text-white",
                    }
                  : null;

            return (
              <div
                key={builder.id}
                role="listitem"
                className="w-[min(85vw,320px)] shrink-0 snap-start sm:w-[min(42vw,380px)] md:w-[min(34vw,420px)]"
              >
                <Link
                  href={href}
                  className="group relative block overflow-hidden rounded-sm ring-1 ring-white/10 transition duration-300 hover:ring-white/35"
                >
                  <div className="relative aspect-video bg-[#1a1a1a]">
                    {poster ? (
                      <Image
                        src={poster}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 85vw, 36vw"
                        className="object-cover transition duration-500 group-hover:scale-[1.04]"
                        unoptimized={poster.startsWith("http")}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />

                    {ribbon && (
                      <span
                        className={cn(
                          "absolute left-2 top-2 z-10 rounded-[2px] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:text-[11px]",
                          ribbon.className,
                        )}
                      >
                        {ribbon.label}
                      </span>
                    )}

                    {hasVideo && (
                      <span className="absolute inset-0 z-[5] flex items-center justify-center opacity-80 transition group-hover:opacity-100">
                        <span className="flex size-12 items-center justify-center rounded-full bg-black/55 text-white ring-1 ring-white/25 backdrop-blur-[2px]">
                          <Play className="size-5 fill-current pl-0.5" />
                        </span>
                      </span>
                    )}

                    <div className="absolute inset-x-0 bottom-0 z-10 flex items-end gap-3 p-3 sm:p-3.5">
                      {builder.logoUrl ? (
                        <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-[#ebe4d6] p-1.5 shadow-md sm:size-12">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={builder.logoUrl}
                            alt=""
                            className="max-h-full max-w-full object-contain"
                          />
                        </span>
                      ) : null}
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold uppercase tracking-wide text-white sm:text-lg">
                          {builder.name}
                        </p>
                        {community && (
                          <p className="mt-0.5 truncate text-xs text-white/65 sm:text-sm">
                            {community.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </LandingCarousel>
      </section>
    </FadeInSection>
  );
}
