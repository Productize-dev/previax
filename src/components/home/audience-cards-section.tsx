import Link from "next/link";
import {
  Building2,
  CircleDollarSign,
  Search,
} from "lucide-react";

import { FadeInSection } from "@/components/ui/fade-in-section";
import { Button } from "@/components/ui/button";
import { CONTACT_EMAIL } from "@/lib/config";
import { NAV_COMMUNITIES_ID } from "@/lib/homepage-nav";
import { PARTNER_PATH, appHash } from "@/lib/routes";

const cards = [
  {
    icon: Search,
    title: "Find Your Community",
    description:
      "Explore new construction communities across North Carolina, compare builders, watch video tours, and connect with a dedicated realtor — all in one place.",
    cta: "Explore Communities",
    href: appHash(NAV_COMMUNITIES_ID),
    external: false,
  },
  {
    icon: CircleDollarSign,
    title: "Finance With Confidence",
    description:
      "Partner with Previax's preferred lenders to get pre-approved fast and be ready to move when you find the right community.",
    cta: "Connect With a Lender",
    href: `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Lender partnership inquiry")}&body=${encodeURIComponent("Hi,\n\nI'd like to connect with a Previax preferred lender.\n\n")}`,
    external: true,
  },
  {
    icon: Building2,
    title: "Showcase Your Community",
    description:
      "List your community on Previax and reach serious buyers actively exploring new construction in the Triad. Video-first, cinematic, and built to convert.",
    cta: "Partner With Us",
    href: PARTNER_PATH,
    external: false,
  },
] as const;

export function AudienceCardsSection() {
  return (
    <FadeInSection>
      <section className="border-t border-border/50 bg-card/30 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-6 md:grid-cols-3">
            {cards.map(
              ({ icon: Icon, title, description, cta, href, external }) => (
                <article
                  key={title}
                  className="flex flex-col items-center rounded-2xl border border-border bg-card px-8 py-10 text-center shadow-sm transition-colors hover:border-primary/40"
                >
                  <div className="flex size-20 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="size-9 stroke-[1.5]" />
                  </div>
                  <h3 className="font-heading mt-6 text-2xl">{title}</h3>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                  {external ? (
                    <Button
                      variant="outline"
                      className="mt-8 min-w-[200px] rounded-full border-primary/40 text-primary hover:bg-primary/10"
                      render={<a href={href} />}
                      nativeButton={false}
                    >
                      {cta}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="mt-8 min-w-[200px] rounded-full border-primary/40 text-primary hover:bg-primary/10"
                      render={<Link href={href} />}
                      nativeButton={false}
                    >
                      {cta}
                    </Button>
                  )}
                </article>
              ),
            )}
          </div>
        </div>
      </section>
    </FadeInSection>
  );
}
