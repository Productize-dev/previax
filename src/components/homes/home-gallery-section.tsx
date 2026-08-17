"use client";

import { VideoPlayer } from "@/components/communities/video-player";
import { FadeInSection } from "@/components/ui/fade-in-section";
import type { Home } from "@/lib/types";

type HomeGallerySectionProps = {
  home: Home;
  communityName: string;
};

export function HomeGallerySection({
  home,
  communityName,
}: HomeGallerySectionProps) {
  const galleryItems = home.mediaGallery ?? [];
  const extraImages = home.imageUrls.slice(1);

  const galleryImages = [
    ...extraImages.map((url, i) => ({
      id: `photo-${i}`,
      url,
      caption: undefined as string | undefined,
    })),
    ...galleryItems
      .filter((m) => m.type === "image" && m.url)
      .map((m) => ({ id: m.id, url: m.url, caption: m.caption })),
  ];
  const videos = galleryItems.filter((m) => m.type === "youtube" && m.url);

  if (galleryImages.length === 0 && videos.length === 0) return null;

  return (
    <FadeInSection>
      <section>
        <p className="section-eyebrow">Gallery</p>
        <h2 className="font-heading mt-2 text-3xl md:text-4xl">
          See this home
        </h2>

        {galleryImages.length > 0 && (
          <div className="mt-8 flex max-w-full snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
            {galleryImages.map((item) => (
              <figure
                key={item.id}
                className="w-[min(85vw,420px)] shrink-0 snap-center overflow-hidden rounded-xl border border-border"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={item.url}
                    alt={item.caption ?? "Home photo"}
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

        {videos.length > 0 && (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {videos.map((item) => (
              <figure key={item.id}>
                <VideoPlayer
                  youtubeUrl={item.url}
                  title={item.caption ?? communityName}
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
