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

  return (
    <FadeInSection>
      <section>
        <p className="section-eyebrow">Gallery</p>
        <h2 className="font-heading mt-2 text-3xl md:text-4xl">
          See more of {community.name}
        </h2>

        {images.length > 0 && (
          <div className="mt-8 -mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 md:-mx-[calc((100vw-72rem)/2+1.5rem)] md:px-[calc((100vw-72rem)/2+1.5rem)]">
            {images.map((item) => (
              <figure
                key={item.id}
                className="w-[min(85vw,420px)] shrink-0 snap-center overflow-hidden rounded-xl border border-border"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={item.url}
                    alt={item.caption ?? "Community photo"}
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

        {videos.length > 0 && (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {videos.map((item) => (
              <figure key={item.id}>
                <VideoPlayer
                  youtubeUrl={item.url}
                  title={item.caption ?? community.name}
                />
                {item.caption && (
                  <figcaption className="mt-2 text-sm text-muted-foreground">
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
