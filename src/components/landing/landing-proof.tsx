"use client";

import Link from "next/link";
import { ArrowRight, Calendar, ClipboardList, Sparkles } from "lucide-react";

import type { LandingAudience } from "@/components/landing/landing-hero";
import { FadeInSection } from "@/components/ui/fade-in-section";
import { APP_HOME, PARTNER_PATH } from "@/lib/routes";

const BUYER_PROMPTS = [
  "3 bed under $400K near good schools",
  "Gated community with new construction",
  "Move-in ready homes with builder offers",
  "Single-story homes under $500K",
] as const;

const BUILDER_STEPS = [
  {
    icon: ClipboardList,
    title: "Apply",
    body: "Tell us about your company and communities in a short form.",
  },
  {
    icon: Calendar,
    title: "Meet",
    body: "Schedule a conversation with the Previax team.",
  },
  {
    icon: Sparkles,
    title: "Get listed",
    body: "We set up your presence — no self-serve account required.",
  },
] as const;

type LandingProofProps = {
  audience: LandingAudience;
};

export function LandingProof({ audience }: LandingProofProps) {
  return (
    <FadeInSection>
      <section className="border-t border-white/10 bg-black px-6 py-20 md:py-28">
        <div className="mx-auto max-w-4xl">
          {audience === "buyer" ? (
            <div key="buyer-proof" className="opacity-0 animate-[landing-fade-up_0.5s_ease-out_forwards]">
              <p className="text-center text-sm font-medium uppercase tracking-[0.2em] text-primary">
                Try it
              </p>
              <h2 className="font-heading mt-3 text-center text-3xl text-white sm:text-4xl">
                Ask for the home you want
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-center text-white/65">
                Natural-language search takes you straight into the catalog.
              </p>
              <ul className="mt-10 flex flex-wrap justify-center gap-3">
                {BUYER_PROMPTS.map((prompt) => (
                  <li key={prompt}>
                    <Link
                      href={`${APP_HOME}?q=${encodeURIComponent(prompt)}`}
                      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white/90 transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-white"
                    >
                      <Sparkles className="size-3.5 text-primary" />
                      {prompt}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div key="builder-proof" className="opacity-0 animate-[landing-fade-up_0.5s_ease-out_forwards]">
              <p className="text-center text-sm font-medium uppercase tracking-[0.2em] text-primary">
                Partnership
              </p>
              <h2 className="font-heading mt-3 text-center text-3xl text-white sm:text-4xl">
                Apply → Meet → Get listed
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-center text-white/65">
                Builders join through a short conversation — not a self-serve signup.
              </p>
              <ol className="mt-12 grid gap-10 sm:grid-cols-3">
                {BUILDER_STEPS.map(({ icon: Icon, title, body }, i) => (
                  <li key={title} className="text-center">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-primary/40 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <p className="mt-4 text-xs font-medium uppercase tracking-widest text-white/40">
                      Step {i + 1}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-white">
                      {title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/60">
                      {body}
                    </p>
                  </li>
                ))}
              </ol>
              <div className="mt-12 flex justify-center">
                <Link
                  href={PARTNER_PATH}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Start partnership
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </FadeInSection>
  );
}
