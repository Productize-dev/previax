import Link from "next/link";

import { PreviaxLogo } from "@/components/layout/previax-logo";
import { CONTACT_EMAIL } from "@/lib/config";
import { APP_HOME, MARKETING_HOME, PARTNER_PATH } from "@/lib/routes";

export function LandingFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-black px-6 py-14">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 sm:flex-row sm:justify-between">
        <div>
          <PreviaxLogo href={MARKETING_HOME} height={48} />
          <p className="mt-3 max-w-xs text-sm text-white/50">
            A smarter way to explore new construction communities in North
            Carolina.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/55">
          <Link href={APP_HOME} className="hover:text-white">
            Explore
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
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="hover:text-white"
          >
            Contact
          </a>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-6xl text-xs text-white/35">
        © {new Date().getFullYear()} Previax. All rights reserved.
      </p>
    </footer>
  );
}
