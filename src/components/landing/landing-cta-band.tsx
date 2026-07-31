import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { LandingAudience } from "@/components/landing/landing-hero";
import { FadeInSection } from "@/components/ui/fade-in-section";
import { APP_HOME, PARTNER_PATH } from "@/lib/routes";

type LandingCtaBandProps = {
  audience?: LandingAudience;
};

export function LandingCtaBand({ audience = "buyer" }: LandingCtaBandProps) {
  const isBuilder = audience === "builder";

  return (
    <FadeInSection>
      <section className="border-t border-white/10 px-6 py-20 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-3xl text-white sm:text-4xl">
            {isBuilder ? "Ready to partner?" : "Ready to explore?"}
          </h2>
          <p className="mt-4 text-white/65">
            {isBuilder
              ? "Tell us about your company — we list and present your communities with a cinematic experience."
              : "Enter the platform and browse premium new construction communities across North Carolina."}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={isBuilder ? PARTNER_PATH : APP_HOME}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {isBuilder ? "Start partnership" : "Explore communities"}
              <ArrowRight className="size-4" />
            </Link>
            {!isBuilder && (
              <Link
                href="/login"
                className="inline-flex items-center rounded-md border border-white/25 px-7 py-3.5 text-base font-medium text-white transition-colors hover:border-white/50 hover:bg-white/5"
              >
                Sign In
              </Link>
            )}
          </div>
          {!isBuilder && (
            <p className="mt-8 text-sm text-white/50">
              Builders:{" "}
              <Link
                href={PARTNER_PATH}
                className="text-primary underline-offset-4 hover:underline"
              >
                partner with us
              </Link>
            </p>
          )}
        </div>
      </section>
    </FadeInSection>
  );
}
