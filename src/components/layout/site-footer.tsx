import Link from "next/link";

import { PreviaxLogo } from "@/components/layout/previax-logo";
import { NAV_COMMUNITIES_ID } from "@/lib/homepage-nav";
import { PARTNER_PATH, appHash } from "@/lib/routes";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-card/50 py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <PreviaxLogo height={56} asLink={false} />
            <p className="mt-2 text-sm text-muted-foreground">
              Premium communities across North Carolina
            </p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <Link href={appHash(NAV_COMMUNITIES_ID)} className="hover:text-foreground">
              Communities
            </Link>
            <Link href="/saved" className="hover:text-foreground">
              Saved
            </Link>
            <Link href="/guidance" className="hover:text-foreground">
              Get Guidance
            </Link>
            <Link href={PARTNER_PATH} className="hover:text-foreground">
              For Builders
            </Link>
            <Link href="/dashboard" className="hover:text-foreground">
              Dashboard
            </Link>
          </div>
        </div>
        <p className="mt-8 text-xs text-muted-foreground">
          Your privacy matters. Contact details for realtors are never shown
          publicly. All inquiries go through our team at inquiries@previax.com.
        </p>
      </div>
    </footer>
  );
}
