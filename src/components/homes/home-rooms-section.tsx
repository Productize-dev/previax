"use client";

import { LayoutGrid } from "lucide-react";

import { FadeInSection } from "@/components/ui/fade-in-section";
import type { Home } from "@/lib/types";

type HomeRoomsSectionProps = {
  home: Home;
};

export function HomeRoomsSection({ home }: HomeRoomsSectionProps) {
  const rooms = home.rooms ?? [];
  if (rooms.length === 0) return null;

  return (
    <FadeInSection>
      <section className="relative -mx-6 overflow-hidden rounded-none bg-card/40 px-6 py-14 md:-mx-[calc((100vw-72rem)/2+1.5rem)] md:px-[calc((100vw-72rem)/2+1.5rem)]">
        <div className="mx-auto max-w-6xl">
          <p className="section-eyebrow">Inside the home</p>
          <h2 className="font-heading mt-2 text-3xl md:text-4xl">
            Rooms & finishes
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            A room-by-room look at what makes this floor plan stand out.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <article
                key={room.id}
                className="listing-card overflow-hidden bg-background/90"
              >
                {room.imageUrl ? (
                  <div className="aspect-[16/10] overflow-hidden">
                    <img
                      src={room.imageUrl}
                      alt={room.name}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[16/10] items-center justify-center bg-muted/50">
                    <LayoutGrid className="size-8 text-muted-foreground/40" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-heading text-lg">{room.name}</h3>
                  {room.size && (
                    <p className="mt-1 text-sm text-primary">{room.size}</p>
                  )}
                  {room.notes && (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {room.notes}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </FadeInSection>
  );
}
