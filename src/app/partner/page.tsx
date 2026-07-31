import type { Metadata } from "next";

import { BuilderPartnerFlow } from "@/components/landing/builder-partner-flow";

export const metadata: Metadata = {
  title: "Partner With Previax — For Builders",
  description:
    "Interested in listing your communities on Previax? Fill a short questionnaire and schedule a partnership meeting. No self-serve account required.",
};

export default function PartnerPage() {
  return <BuilderPartnerFlow />;
}
