"use client";

import { MapPin, GraduationCap, Clock, DollarSign } from "lucide-react";

import type { Community } from "@/lib/types";

type CommunityHighlightsProps = {
  community: Community;
};

export function CommunityHighlights({ community }: CommunityHighlightsProps) {
  const amenities = community.amenities ?? [];
  const lenders = community.lenders ?? [];
  const hasMeta =
    amenities.length > 0 ||
    lenders.length > 0 ||
    Boolean(community.mainHighlight) ||
    community.schoolDistrict ||
    community.commuteNotes ||
    community.hoaRange;

  if (!hasMeta) return null;

  return (
    <section>
      <h2 className="font-heading mb-4 text-2xl">Community Highlights</h2>
      {community.mainHighlight && (
        <p className="mb-4 text-muted-foreground">{community.mainHighlight}</p>
      )}
      {amenities.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {amenities.map((a) => (
            <span
              key={a}
              className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary"
            >
              {a}
            </span>
          ))}
        </div>
      )}
      {lenders.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-sm font-medium">Preferred lenders</p>
          <div className="flex flex-wrap gap-2">
            {lenders.map((lender) => (
              <span
                key={lender}
                className="rounded-full border border-border bg-card px-3 py-1 text-sm"
              >
                {lender}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {community.schoolDistrict && (
          <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
            <GraduationCap className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">School district</p>
              <p className="text-sm text-muted-foreground">
                {community.schoolDistrict}
              </p>
            </div>
          </div>
        )}
        {community.commuteNotes && (
          <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
            <Clock className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">Commute</p>
              <p className="text-sm text-muted-foreground">
                {community.commuteNotes}
              </p>
            </div>
          </div>
        )}
        {community.hoaRange && (
          <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
            <DollarSign className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">HOA</p>
              <p className="text-sm text-muted-foreground">
                {community.hoaRange}
              </p>
            </div>
          </div>
        )}
        {(community.latitude || community.city) && (
          <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
            <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">Map</p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${community.city}, North Carolina`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                View on Google Maps
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
