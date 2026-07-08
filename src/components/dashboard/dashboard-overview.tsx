"use client";

import { Compass, Hammer, Landmark, Sparkles } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useData } from "@/context/data-context";
import type { DashboardTab } from "@/lib/types";

type DashboardOverviewProps = {
  onNavigate: (tab: DashboardTab) => void;
};

export function DashboardOverview({ onNavigate }: DashboardOverviewProps) {
  const { communities, builders, featured, lenders, featuredCommunities, top10Communities } =
    useData();

  const totalModels = communities.reduce(
    (sum, community) => sum + community.homes.length,
    0,
  );

  const sections = [
    {
      title: "Builders",
      description:
        "Builder profiles, their communities, and home models — the core catalog structure.",
      stats: [
        { label: "Builders", value: builders.length, tab: "builders" as const },
        {
          label: "Communities",
          value: communities.length,
          tab: "communities" as const,
        },
        { label: "Models", value: totalModels, tab: "communities" as const },
      ],
      icon: Hammer,
      tab: "builders" as const,
    },
    {
      title: "Lenders",
      description: "Lender profiles for the homepage Preferred Lenders row.",
      stats: [
        { label: "Lender profiles", value: lenders.length, tab: "lenders" as const },
      ],
      icon: Landmark,
      tab: "lenders" as const,
    },
    {
      title: "Others",
      description: "Homepage presentation — carousel, curated rows, and more.",
      stats: [
        {
          label: "Featured slides",
          value: featured.length,
          tab: "featured" as const,
        },
        {
          label: "Featured Communities",
          value: featuredCommunities.length,
          tab: "featured-communities" as const,
        },
        {
          label: "Top 10 slots",
          value: top10Communities.length,
          tab: "top-10" as const,
        },
      ],
      icon: Sparkles,
      tab: "featured" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl">Site Overview</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Dashboard is organized into Builders, Lenders, and Others. Manage
          catalog content under Builders; homepage extras live under Others.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {sections.map(({ title, description, stats, icon: Icon, tab }) => (
          <button
            key={title}
            type="button"
            onClick={() => onNavigate(tab)}
            className="text-left"
          >
            <Card className="h-full transition-colors hover:border-primary/50">
              <CardHeader className="flex-row items-center justify-between pb-2">
                <CardTitle className="font-heading text-lg">{title}</CardTitle>
                <Icon className="size-5 text-primary" />
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{description}</p>
                <div className="flex flex-wrap gap-4">
                  {stats.map(({ label, value }) => (
                    <div key={label}>
                      <p className="font-heading text-2xl">{value}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Quick guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">All Communities</strong> — View
            and edit every community and model, including tags for homepage
            organization.
          </p>
          <p>
            <strong className="text-foreground">Builders</strong> — Add a
            builder, then communities and home models under that builder.
          </p>
          <p>
            <strong className="text-foreground">Lenders</strong> — Manage
            lender names, descriptions, and optional photos for the homepage
            lenders row.
          </p>
          <p>
            <strong className="text-foreground">Others → Featured Carousel</strong>{" "}
            — Netflix-style hero slides with YouTube videos.
          </p>
          <p>
            <strong className="text-foreground">
              Others → Featured Communities
            </strong>{" "}
            — Curate the row below Trending Now on the homepage.
          </p>
          <p>
            <strong className="text-foreground">Others → Top 10 Communities</strong>{" "}
            — Assign ranks 1–10 for the badge on each community detail page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
