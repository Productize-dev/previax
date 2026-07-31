import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/landing-page";
import { getCurrentProfile } from "@/lib/auth/server";
import { APP_HOME } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Previax — New Construction Communities in North Carolina",
  description:
    "Explore premium new construction communities, compare builders, and partner with Previax — the cinematic marketplace for homebuyers and builders in North Carolina.",
};

export default async function MarketingHomePage() {
  const profile = await getCurrentProfile();
  if (profile) {
    redirect(APP_HOME);
  }

  return <LandingPage />;
}
