import type { ActivityEvent } from "@/lib/types";

const LABELS: Record<string, string> = {
  community_created: "New community added",
  offer_published: "Financing offer published",
  account_approved: "Account approved",
  community_viewed: "Community viewed",
  community_saved: "Community saved",
  community_unsaved: "Community unsaved",
  offer_clicked: "Offer clicked",
};

export function getActivityLabel(type: string): string {
  return LABELS[type] ?? type.replace(/_/g, " ");
}

export function formatActivityTime(iso: string): string {
  const date = new Date(iso);
  const now = Date.now();
  const diff = now - date.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function activityEntityHint(
  event: ActivityEvent,
  communityName?: string,
): string {
  if (communityName) return communityName;
  if (event.metadata?.name) return String(event.metadata.name);
  if (event.metadata?.title) return String(event.metadata.title);
  if (event.metadata?.email) return String(event.metadata.email);
  return event.entityId.slice(0, 12);
}
