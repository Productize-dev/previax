"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

import { FadeInSection } from "@/components/ui/fade-in-section";
import { useData } from "@/context/data-context";
import { CONTACT_EMAIL } from "@/lib/config";
import { APP_HOME, PARTNER_PATH } from "@/lib/routes";
import { cn } from "@/lib/utils";

const CARD_IMAGES = {
  lenders:
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
  associations:
    "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80",
  realtors:
    "https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=800&q=80",
  builders:
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
  employers:
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
} as const;

type NetworkCard = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  href?: string;
};

export function LandingNetwork() {
  const { lenders } = useData();

  const cards = useMemo<NetworkCard[]>(() => {
    const lenderCount = lenders.length;
    return [
      {
        id: "lenders",
        title: "Preferred Lenders",
        subtitle:
          lenderCount > 0
            ? `${lenderCount} financing partner${lenderCount === 1 ? "" : "s"} for smart buyers.`
            : "Financing partners for smart buyers.",
        image: CARD_IMAGES.lenders,
        href: `${APP_HOME}#lenders`,
      },
      {
        id: "associations",
        title: "Industry Associations",
        subtitle: "Trusted local industry networks.",
        image: CARD_IMAGES.associations,
        href: `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Industry partnership")}`,
      },
      {
        id: "realtors",
        title: "Realtors",
        subtitle: "Get personalized guidance.",
        image: CARD_IMAGES.realtors,
        href: "/guidance",
      },
      {
        id: "builders",
        title: "Builders",
        subtitle: "Leading home builders.",
        image: CARD_IMAGES.builders,
        href: PARTNER_PATH,
      },
      {
        id: "employers",
        title: "Major Employers",
        subtitle: "Healthcare, corporate & hospitality.",
        image: CARD_IMAGES.employers,
        href: `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Employer partnership")}`,
      },
    ];
  }, [lenders.length]);

  return (
    <FadeInSection>
      <section
        id="lenders"
        className="scroll-mt-24 border-t border-white/10 bg-[#0a0a0a] px-6 py-16 md:py-24"
      >
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-heading text-4xl font-bold uppercase tracking-[0.12em] text-white sm:text-5xl">
            Network
          </h2>

          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {cards.map((card) => {
              const inner = (
                <>
                  <Image
                    src={card.image}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 50vw, 20vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />
                  <div className="absolute inset-x-0 bottom-0 z-10 p-4">
                    <p className="text-base font-semibold text-white">
                      {card.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-white/65">
                      {card.subtitle}
                    </p>
                  </div>
                </>
              );

              return (
                <li key={card.id}>
                  {card.href ? (
                    <Link
                      href={card.href}
                      className={cn(
                        "group relative block aspect-[4/5] overflow-hidden rounded-lg ring-1 ring-white/10 transition hover:ring-primary/40",
                      )}
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div className="group relative aspect-[4/5] overflow-hidden rounded-lg ring-1 ring-white/10">
                      {inner}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </FadeInSection>
  );
}
