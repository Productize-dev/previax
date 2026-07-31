import Link from "next/link";
import { Phone } from "lucide-react";

import { PreviaxLogo } from "@/components/layout/previax-logo";
import {
  CONTACT_EMAIL,
  contactPhoneTelHref,
  formatContactPhone,
} from "@/lib/config";
import { APP_HOME, MARKETING_HOME, PARTNER_PATH } from "@/lib/routes";

export function LandingFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-black px-6 py-14">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row lg:justify-between">
        <div>
          <PreviaxLogo href={MARKETING_HOME} height={48} />
          <p className="mt-3 max-w-xs text-sm text-white/50">
            A smarter way to explore new construction communities in North
            Carolina.
          </p>
          <a
            href={contactPhoneTelHref()}
            className="mt-5 inline-flex items-center gap-2 text-lg font-semibold text-white transition-colors hover:text-primary"
          >
            <Phone className="size-5 text-primary" />
            {formatContactPhone()}
          </a>
          <p className="mt-2 text-sm text-white/45">
            Stay connected with Previax.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
            Explore
          </p>
          <div className="mt-4 flex flex-col gap-3 text-sm text-white/55">
            <Link href={APP_HOME} className="hover:text-white">
              Explore communities
            </Link>
            <Link href="/guidance" className="hover:text-white">
              Get Guidance
            </Link>
            <Link href={PARTNER_PATH} className="hover:text-white">
              For Builders
            </Link>
            <Link href="/login" className="hover:text-white">
              Sign In
            </Link>
            <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-white">
              Contact
            </a>
          </div>
        </div>
      </div>

      <p className="mx-auto mt-10 max-w-6xl text-xs text-white/35">
        © {new Date().getFullYear()} Previax. All rights reserved. A smarter way
        to explore communities.
      </p>
      <p className="mx-auto mt-2 max-w-6xl text-[11px] leading-relaxed text-white/25">
        Previax Beta: Selected partner logos and related content may be
        displayed for demonstration purposes only and do not imply formal
        affiliation, endorsement, or approval unless explicitly stated.
      </p>
    </footer>
  );
}
