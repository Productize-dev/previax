"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Film,
  Send,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { isValidYouTubeUrl } from "@/lib/youtube";
import { cn } from "@/lib/utils";

type PipelineAction =
  | "complete_step1"
  | "start_step2"
  | "submit_step2"
  | "admin_approve"
  | "admin_reject"
  | "builder_approve"
  | "builder_reject";

const PIPELINE_STAGES: Array<{
  id: CommunityPipelineStatus | "step1" | "step2";
  label: string;
  matches: CommunityPipelineStatus[];
}> = [
  {
    id: "step1",
    label: "1. Info",
    matches: ["draft", "rejected"],
  },
  {
    id: "step2",
    label: "2. Video",
    matches: ["awaiting_video", "video_review"],
  },
  {
    id: "pending_admin",
    label: "3. Admin",
    matches: ["pending_admin"],
  },
  {
    id: "pending_builder",
    label: "4. Builder",
    matches: ["pending_builder"],
  },
  {
    id: "live",
    label: "5. Live",
    matches: ["live"],
  },
];

function stageIndex(status: CommunityPipelineStatus): number {
  if (status === "live") return 4;
  if (status === "pending_builder") return 3;
  if (status === "pending_admin") return 2;
  if (status === "awaiting_video" || status === "video_review") return 1;
  return 0;
}

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
  const { communities, updateCommunity, refresh } = useData();
  const { isAdmin, isBuilder, isSales } = useDashboardData();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"in_progress" | "done">("in_progress");
  const [step2Drafts, setStep2Drafts] = useState<
    Record<string, { youtubeUrl: string; thumbnailUrl: string }>
  >({});

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

  function step2Values(community: Community) {
    return (
      step2Drafts[community.id] ?? {
        youtubeUrl: community.youtubeUrl ?? "",
        thumbnailUrl: community.thumbnailUrl ?? "",
      }
    );
  }

  function setStep2Field(
    communityId: string,
    field: "youtubeUrl" | "thumbnailUrl",
    value: string,
    community: Community,
  ) {
    setStep2Drafts((prev) => ({
      ...prev,
      [communityId]: {
        youtubeUrl:
          field === "youtubeUrl"
            ? value
            : (prev[communityId]?.youtubeUrl ?? community.youtubeUrl ?? ""),
        thumbnailUrl:
          field === "thumbnailUrl"
            ? value
            : (prev[communityId]?.thumbnailUrl ?? community.thumbnailUrl ?? ""),
      },
    }));
  }

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

  async function submitStep2(community: Community) {
    const values = step2Values(community);
    if (!isValidYouTubeUrl(values.youtubeUrl)) {
      toastError("Enter a valid YouTube URL for Step 2");
      return;
    }
    setBusyId(community.id);
    try {
      await updateCommunity(community.id, {
        youtubeUrl: values.youtubeUrl.trim(),
        thumbnailUrl: values.thumbnailUrl.trim() || undefined,
      });
      const status = getPipelineStatus(community);
      if (status === "awaiting_video") {
        await runPipelineAction(community.id, "start_step2");
      }
      await runPipelineAction(community.id, "submit_step2");
      setStep2Drafts((prev) => {
        const next = { ...prev };
        delete next[community.id];
        return next;
      });
      await refresh();
      toastSuccess("Step 2 submitted — waiting for admin approval");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Step 2 failed");
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
            ? "Full path: Step 1 (info) → Step 2 (YouTube here) → admin approval → builder approval → live."
            : mode === "builder"
              ? "Approve within 5 days or the community publishes automatically."
              : "Track sales submissions, video handoff, and approvals through go-live."}
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
            const currentStage = stageIndex(status);
            const showStep2Form =
              (isSales || isAdmin) &&
              (status === "awaiting_video" || status === "video_review");
            const values = step2Values(community);

            return (
              <li
                key={community.id}
                className="space-y-4 rounded-xl border border-border bg-card/40 p-4"
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
                    {status === "rejected" && community.rejectionReason && (
                      <p className="mt-2 text-xs text-destructive">
                        Rejected: {community.rejectionReason}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(isSales || isAdmin) &&
                      (status === "draft" || status === "rejected") && (
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() => void act(community, "complete_step1")}
                        >
                          <Send className="mr-1.5 size-3.5" />
                          {status === "rejected"
                            ? "Resubmit Step 1"
                            : "Complete Step 1"}
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

                <ol className="flex flex-wrap gap-1.5">
                  {PIPELINE_STAGES.map((stage, index) => {
                    const doneStage =
                      status === "live"
                        ? true
                        : status === "rejected"
                          ? false
                          : index < currentStage;
                    const active =
                      status !== "rejected" &&
                      status !== "live" &&
                      index === currentStage;
                    const liveDone = status === "live" && index === 4;
                    return (
                      <li
                        key={stage.id}
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[11px] font-medium",
                          liveDone || doneStage
                            ? "bg-emerald-500/15 text-emerald-600"
                            : active
                              ? "bg-primary/15 text-primary"
                              : status === "rejected" && index === 0
                                ? "bg-destructive/15 text-destructive"
                                : "bg-muted text-muted-foreground",
                        )}
                      >
                        {stage.label}
                      </li>
                    );
                  })}
                </ol>

                {showStep2Form && (
                  <div className="space-y-3 rounded-lg border border-dashed border-border bg-background/40 p-3">
                    <div>
                      <p className="text-sm font-medium">
                        Step 2 — Attach YouTube video
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Separate from Step 1. Add the finished cut, then submit
                        for admin review.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor={`yt-${community.id}`}>YouTube URL</Label>
                        <Input
                          id={`yt-${community.id}`}
                          type="url"
                          value={values.youtubeUrl}
                          onChange={(e) =>
                            setStep2Field(
                              community.id,
                              "youtubeUrl",
                              e.target.value,
                              community,
                            )
                          }
                          placeholder="https://www.youtube.com/watch?v=..."
                        />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor={`thumb-${community.id}`}>
                          Thumbnail URL (optional)
                        </Label>
                        <Input
                          id={`thumb-${community.id}`}
                          type="url"
                          value={values.thumbnailUrl}
                          onChange={(e) =>
                            setStep2Field(
                              community.id,
                              "thumbnailUrl",
                              e.target.value,
                              community,
                            )
                          }
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      disabled={busy}
                      onClick={() => void submitStep2(community)}
                    >
                      {busy ? (
                        <Clock className="mr-1.5 size-3.5 animate-spin" />
                      ) : (
                        <Film className="mr-1.5 size-3.5" />
                      )}
                      Submit Step 2 for admin
                    </Button>
                  </div>
                )}

                {status === "pending_admin" && community.youtubeUrl && (
                  <p className="text-xs text-muted-foreground">
                    Video submitted:{" "}
                    <a
                      href={community.youtubeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-2"
                    >
                      Open YouTube
                    </a>
                  </p>
                )}
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
