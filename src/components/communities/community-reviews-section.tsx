"use client";

import { Quote, Star } from "lucide-react";

import { FadeInSection } from "@/components/ui/fade-in-section";
import type { Community } from "@/lib/types";

type CommunityReviewsSectionProps = {
  community: Community;
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`size-4 ${
            i < rating
              ? "fill-primary text-primary"
              : "fill-muted text-muted"
          }`}
        />
      ))}
    </div>
  );
}

export function CommunityReviewsSection({
  community,
}: CommunityReviewsSectionProps) {
  const reviews = community.reviews ?? [];
  if (reviews.length === 0) return null;

  return (
    <FadeInSection>
      <section className="relative -mx-6 overflow-hidden rounded-none bg-gradient-to-br from-primary/5 via-transparent to-transparent px-6 py-14 md:-mx-[calc((100vw-72rem)/2+1.5rem)] md:px-[calc((100vw-72rem)/2+1.5rem)]">
        <div className="mx-auto max-w-6xl">
          <p className="section-eyebrow">Voices</p>
          <h2 className="font-heading mt-2 text-3xl md:text-4xl">
            What residents say
          </h2>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {reviews.map((review) => (
              <blockquote
                key={review.id}
                className="relative rounded-xl border border-border/80 bg-background/90 p-6 backdrop-blur-sm"
              >
                <Quote className="absolute top-4 right-4 size-8 text-primary/20" />
                <Stars rating={review.rating} />
                <p className="mt-4 text-base leading-relaxed text-foreground/90">
                  &ldquo;{review.quote}&rdquo;
                </p>
                <footer className="mt-5 flex items-center gap-3">
                  {review.avatarUrl ? (
                    <img
                      src={review.avatarUrl}
                      alt=""
                      className="size-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      {review.author.charAt(0)}
                    </div>
                  )}
                  <div>
                    <cite className="not-italic font-medium">{review.author}</cite>
                    {review.date && (
                      <p className="text-xs text-muted-foreground">
                        {review.date}
                      </p>
                    )}
                  </div>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>
    </FadeInSection>
  );
}
