import { BUILDER_APPROVAL_DAYS } from "@/lib/config";
import type { Community, CommunityPipelineStatus } from "@/lib/types";

export const PIPELINE_IN_PROGRESS: CommunityPipelineStatus[] = [
  "draft",
  "awaiting_video",
  "video_review",
  "pending_admin",
  "pending_builder",
];

export const PIPELINE_DONE: CommunityPipelineStatus[] = ["live", "rejected"];

export function getPipelineStatus(
  community: Community,
): CommunityPipelineStatus {
  return community.pipelineStatus ?? "live";
}

export function isPipelineInProgress(community: Community): boolean {
  return PIPELINE_IN_PROGRESS.includes(getPipelineStatus(community));
}

export function pipelineStatusLabel(status: CommunityPipelineStatus): string {
  switch (status) {
    case "draft":
      return "Draft — Step 1";
    case "awaiting_video":
      return "Awaiting video";
    case "video_review":
      return "Step 2 — Video review";
    case "pending_admin":
      return "Pending admin approval";
    case "pending_builder":
      return "Pending builder approval";
    case "live":
      return "Live";
    case "rejected":
      return "Rejected";
    default:
      return status;
  }
}

export function builderDeadlineFrom(now = Date.now()): number {
  return now + BUILDER_APPROVAL_DAYS * 24 * 60 * 60 * 1000;
}

export function daysLeft(deadlineAt?: number, now = Date.now()): number | null {
  if (!deadlineAt) return null;
  return Math.ceil((deadlineAt - now) / (24 * 60 * 60 * 1000));
}
