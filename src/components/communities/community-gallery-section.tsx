"use client";

import { VideoPlayer } from "@/components/communities/video-player";
import { FadeInSection } from "@/components/ui/fade-in-section";
import type { Community } from "@/lib/types";

type CommunityGallerySectionProps = {
  community: Community;
};

export function CommunityGallerySection({
  community,
}: CommunityGallerySectionProps) {
  const items = community.mediaGallery ?? [];
  if (items.length === 0) return null;

  const images = items.filter((m) => m.type === "image" && m.url);
  const videos = items.filter((m) => m.type === "youtube" && m.url);
  const hasVideos = videos.length > 0;

  return (
    <FadeInSection>
      <section>
        <p className="section-eyebrow">
          {hasVideos ? "Tour by area" : "Gallery"}
        </p>
        <h2 className="font-heading mt-2 text-3xl md:text-4xl">
          {hasVideos
            ? `Explore ${community.name}`
            : `See more of ${community.name}`}
        </h2>
        {hasVideos && (
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Walk through the spaces that make this community feel like home —
            amenities, gathering spots, and everyday living.
          </p>
        )}

        {videos.length > 0 && (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {videos.map((item) => {
              const title = item.caption?.trim() || community.name;
              return (
                <figure key={item.id} className="space-y-2">
                  <VideoPlayer youtubeUrl={item.url} title={title} />
                  <figcaption className="text-sm font-medium text-foreground">
                    {title}
                  </figcaption>
                </figure>
              );
            })}
          </div>
        )}

        {images.length > 0 && (
          <div className="mt-8 flex max-w-full snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
            {images.map((item) => (
              <figure
                key={item.id}
                className="w-[min(85vw,420px)] shrink-0 snap-center overflow-hidden rounded-xl border border-border"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={item.url}
                    alt={item.caption ?? "Community photo"}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </div>
                {item.caption && (
                  <figcaption className="bg-card px-4 py-2 text-sm text-muted-foreground">
                    {item.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        )}
      </section>
    </FadeInSection>
  );
}
