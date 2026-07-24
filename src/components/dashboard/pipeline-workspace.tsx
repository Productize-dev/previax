"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Clock, Film, Send, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useProfile } from "@/context/auth-context";
import { useData } from "@/context/data-context";
import {
  daysLeft,
  getPipelineStatus,
  isPipelineInProgress,
  pipelineStatusLabel,
} from "@/lib/sales-pipeline";
import { toastError, toastSuccess } from "@/lib/toast";
import type { Community, CommunityPipelineStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type PipelineAction =
  | "complete_step1"
  | "start_step2"
  | "submit_step2"
  | "admin_approve"
  | "admin_reject"
  | "builder_approve"
  | "builder_reject";

async function runPipelineAction(
  communityId: string,
  action: PipelineAction,
  rejectionReason?: string,
) {
  const res = await fetch("/api/pipeline/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ communityId, action, rejectionReason }),
  });
  const data = (await res.json()) as { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Action failed");
}

type PipelineWorkspaceProps = {
  mode: "sales" | "admin" | "builder";
};

export function PipelineWorkspace({ mode }: PipelineWorkspaceProps) {
  const profile = useProfile();
  const { communities, refresh } = useData();
  const { isAdmin, isBuilder, isSales } = useDashboardData();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"in_progress" | "done">("in_progress");

  const scoped = useMemo(() => {
    let list = communities;
    if (mode === "sales" && profile) {
      list = list.filter(
        (c) => c.submittedBy === profile.id || c.ownerId === profile.id,
      );
    }
    if (mode === "builder") {
      list = list.filter((c) => getPipelineStatus(c) === "pending_builder");
    }
    if (mode === "admin") {
      list = list.filter((c) => {
        const status = getPipelineStatus(c);
        return status !== "live" || Boolean(c.submittedBy);
      });
    }
    return list;
  }, [communities, mode, profile]);

  const inProgress = scoped.filter(isPipelineInProgress);
  const done = scoped.filter((c) => !isPipelineInProgress(c));
  const rows = filter === "in_progress" ? inProgress : done;

  async function act(
    community: Community,
    action: PipelineAction,
    rejectionReason?: string,
  ) {
    setBusyId(community.id);
    try {
      await runPipelineAction(community.id, action, rejectionReason);
      await refresh();
      toastSuccess("Pipeline updated");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl">
          {mode === "sales"
            ? "My community pipeline"
            : mode === "builder"
              ? "Communities awaiting your approval"
              : "Publishing pipeline"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "sales"
            ? "Step 1: community info → Step 2: YouTube review → admin & builder approval."
            : mode === "builder"
              ? "Approve within 5 days or the community publishes automatically."
              : "Track sales submissions, video production handoff, and approvals."}
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={filter === "in_progress" ? "default" : "outline"}
          onClick={() => setFilter("in_progress")}
        >
          In progress ({inProgress.length})
        </Button>
        <Button
          type="button"
          size="sm"
          variant={filter === "done" ? "default" : "outline"}
          onClick={() => setFilter("done")}
        >
          Completed ({done.length})
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          No communities in this list yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((community) => {
            const status = getPipelineStatus(community);
            const left = daysLeft(community.builderDeadlineAt);
            const busy = busyId === community.id;

            return (
              <li
                key={community.id}
                className="rounded-xl border border-border bg-card/40 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">
                      {community.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {community.city} · {community.builderName || "No builder"}
                    </p>
                    <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
                      <StatusIcon status={status} />
                      {pipelineStatusLabel(status)}
                      {status === "pending_builder" && left != null && (
                        <span className="text-muted-foreground">
                          · {left > 0 ? `${left}d left` : "auto-publish due"}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(isSales || isAdmin) && status === "draft" && (
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => void act(community, "complete_step1")}
                      >
                        <Send className="mr-1.5 size-3.5" />
                        Complete Step 1
                      </Button>
                    )}
                    {(isSales || isAdmin) && status === "awaiting_video" && (
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => void act(community, "start_step2")}
                      >
                        <Film className="mr-1.5 size-3.5" />
                        Start Step 2
                      </Button>
                    )}
                    {(isSales || isAdmin) &&
                      (status === "video_review" ||
                        status === "awaiting_video") &&
                      Boolean(community.youtubeUrl?.trim()) && (
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() => void act(community, "submit_step2")}
                        >
                          Submit for admin
                        </Button>
                      )}
                    {isAdmin && status === "pending_admin" && (
                      <>
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() => void act(community, "admin_approve")}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() =>
                            void act(
                              community,
                              "admin_reject",
                              "Needs revisions",
                            )
                          }
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {(isBuilder || isAdmin) &&
                      status === "pending_builder" && (
                        <>
                          <Button
                            size="sm"
                            disabled={busy}
                            onClick={() =>
                              void act(community, "builder_approve")
                            }
                          >
                            Approve & publish
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() =>
                              void act(
                                community,
                                "builder_reject",
                                "Builder requested changes",
                              )
                            }
                          >
                            Reject
                          </Button>
                        </>
                      )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: CommunityPipelineStatus }) {
  if (status === "live") {
    return <CheckCircle2 className="size-3.5 text-emerald-500" />;
  }
  if (status === "rejected") {
    return <XCircle className="size-3.5 text-destructive" />;
  }
  return <Clock className={cn("size-3.5 text-muted-foreground")} />;
}
