"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  Link2,
  Loader2,
  Pencil,
  ShieldOff,
  Trash2,
  UserCheck,
  UserMinus,
  UserPlus,
  Ban,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useProfile } from "@/context/auth-context";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { toastError, toastSuccess } from "@/lib/toast";
import type { Profile } from "@/lib/types";
import { mapProfileRow, PROFILE_COLUMNS, type ProfileRow } from "@/lib/auth/profile";
import { cn } from "@/lib/utils";

type ManageAction =
  | "delete"
  | "suspend"
  | "activate"
  | "remove_sales"
  | "update"
  | "resend";

async function manageSales(
  userId: string,
  action: ManageAction,
  fullName?: string,
) {
  const res = await fetch("/api/admin/manage-sales", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, action, fullName }),
  });
  const data = (await res.json()) as {
    error?: string;
    actionLink?: string;
  };
  if (!res.ok) throw new Error(data.error ?? "Action failed");
  return data;
}

export function SalesTeamManager() {
  const me = useProfile();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);
  const [salesPeople, setSalesPeople] = useState<Profile[]>([]);
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await getSupabaseBrowserClient()
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("role", "sales")
      .order("created_at", { ascending: false });
    if (error) {
      toastError(error.message);
      return;
    }
    setSalesPeople(
      ((data ?? []) as ProfileRow[]).map(mapProfileRow),
    );
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setLastInviteLink(null);
    try {
      const res = await fetch("/api/admin/invite-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullName }),
      });
      const data = (await res.json()) as {
        error?: string;
        emailSent?: boolean;
        emailSkipped?: boolean;
        actionLink?: string;
        mode?: "invite" | "existing";
      };
      if (!res.ok) throw new Error(data.error ?? "Invite failed");

      if (data.actionLink) setLastInviteLink(data.actionLink);

      if (data.emailSent) {
        toastSuccess(
          `Invite emailed to ${email}. They must open that link to set a password.`,
        );
      } else if (data.emailSkipped) {
        toastSuccess(
          `Sales access ready for ${email}. Copy the invite link below and send it to them (email provider not configured).`,
        );
      } else if (data.mode === "existing") {
        toastSuccess(
          `${email} already had an account — upgraded to sales. Share the invite link below.`,
        );
      } else {
        toastSuccess(`Sales access ready for ${email}. Share the invite link below.`);
      }
      setEmail("");
      setFullName("");
      await load();
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Invite failed");
    } finally {
      setBusy(false);
    }
  }

  async function copyInviteLink() {
    if (!lastInviteLink) return;
    try {
      await navigator.clipboard.writeText(lastInviteLink);
      toastSuccess("Invite link copied");
    } catch {
      toastError("Could not copy — select the link manually");
    }
  }

  async function runRowAction(
    person: Profile,
    action: ManageAction,
    confirmMessage?: string,
  ) {
    if (person.id === me?.id) {
      toastError("You cannot change your own account here");
      return;
    }
    if (confirmMessage && !window.confirm(confirmMessage)) return;

    setRowBusyId(person.id);
    try {
      const data = await manageSales(
        person.id,
        action,
        action === "update" ? editName : undefined,
      );
      if (action === "resend" && data.actionLink) {
        setLastInviteLink(data.actionLink);
        toastSuccess("Invite link ready — copy it below");
      } else if (action === "delete") {
        toastSuccess("Account deleted");
      } else if (action === "remove_sales") {
        toastSuccess("Removed from sales team");
      } else if (action === "suspend") {
        toastSuccess("Access suspended");
      } else if (action === "activate") {
        toastSuccess("Access restored");
      } else if (action === "update") {
        toastSuccess("Name updated");
        setEditingId(null);
      }
      await load();
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setRowBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-2xl">Sales team</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Invite sales users by email. They can submit communities through the
          2-step publishing pipeline (admin + builder approval required).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invite sales</CardTitle>
          <CardDescription>
            After inviting, copy the one-click link and send it to them (or
            configure Resend so we email it). That link opens{" "}
            <strong>Set your password</strong> — not Sign in. They should not
            register or sign in until they finish that step.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={(e) => void handleInvite(e)} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="sales-email">Email</Label>
                <Input
                  id="sales-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sales@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sales-name">Full name (optional)</Label>
                <Input
                  id="sales-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Rivera"
                />
              </div>
            </div>
            <Button type="submit" disabled={busy}>
              {busy ? (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              ) : (
                <UserPlus className="mr-1.5 size-4" />
              )}
              Send invite
            </Button>
          </form>

          {lastInviteLink && (
            <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
              <p className="text-sm font-medium">One-click invite link</p>
              <p className="text-xs text-muted-foreground">
                Send this exact link to the sales person. It opens Set your
                password — ignore any older Supabase invite emails that land on
                Sign in.
              </p>
              <p className="break-all font-mono text-xs">{lastInviteLink}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void copyInviteLink()}
              >
                Copy link
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Current sales users</h3>
        {salesPeople.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sales users yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {salesPeople.map((person) => {
              const isSelf = person.id === me?.id;
              const busyRow = rowBusyId === person.id;
              const suspended = person.status === "rejected";

              return (
                <li key={person.id} className="space-y-3 px-3 py-3 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      {editingId === person.id ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-8 max-w-xs"
                            disabled={busyRow}
                          />
                          <Button
                            type="button"
                            size="sm"
                            disabled={busyRow || !editName.trim()}
                            onClick={() =>
                              void runRowAction(person, "update")
                            }
                          >
                            Save
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={busyRow}
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <>
                          <p className="font-medium">
                            {person.fullName || "Unnamed"}
                            {isSelf && (
                              <span className="ml-2 text-xs font-normal text-muted-foreground">
                                (you)
                              </span>
                            )}
                          </p>
                          <p className="truncate text-muted-foreground">
                            {person.email}
                          </p>
                        </>
                      )}
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs uppercase tracking-wide",
                        suspended
                          ? "bg-destructive/15 text-destructive"
                          : person.status === "active"
                            ? "bg-primary/15 text-primary"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {suspended ? "suspended" : person.status}
                    </span>
                  </div>

                  {!isSelf && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busyRow}
                        onClick={() => {
                          setEditingId(person.id);
                          setEditName(person.fullName ?? "");
                        }}
                      >
                        <Pencil className="mr-1 size-3.5" />
                        Rename
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busyRow}
                        onClick={() => void runRowAction(person, "resend")}
                      >
                        <Link2 className="mr-1 size-3.5" />
                        Invite link
                      </Button>
                      {suspended ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busyRow}
                          onClick={() => void runRowAction(person, "activate")}
                        >
                          <UserCheck className="mr-1 size-3.5" />
                          Activate
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busyRow}
                          onClick={() =>
                            void runRowAction(
                              person,
                              "suspend",
                              `Suspend ${person.email}? They will lose dashboard access until you activate them again.`,
                            )
                          }
                        >
                          <Ban className="mr-1 size-3.5" />
                          Suspend
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busyRow}
                        onClick={() =>
                          void runRowAction(
                            person,
                            "remove_sales",
                            `Remove sales access from ${person.email}? The account stays as a buyer.`,
                          )
                        }
                      >
                        <UserMinus className="mr-1 size-3.5" />
                        Remove sales
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={busyRow}
                        onClick={() =>
                          void runRowAction(
                            person,
                            "delete",
                            `Permanently delete ${person.email}? This removes their login. Communities they submitted stay, but are unlinked from them.`,
                          )
                        }
                      >
                        {busyRow ? (
                          <Loader2 className="mr-1 size-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="mr-1 size-3.5" />
                        )}
                        Delete
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-xs text-muted-foreground">
          <ShieldOff className="mr-1 inline size-3.5 align-text-bottom" />
          Suspend blocks access. Remove sales keeps the account as buyer. Delete
          removes the auth user permanently.
        </p>
      </div>
    </div>
  );
}

type NotifRow = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotifRow[]>([]);

  const load = useCallback(async () => {
    const { data } = await getSupabaseBrowserClient()
      .from("notifications")
      .select("id, title, body, href, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    setItems((data as NotifRow[] | null) ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const unread = items.filter((item) => !item.read_at).length;

  async function markRead(id: string) {
    await getSupabaseBrowserClient()
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
    await load();
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label="Notifications"
        onClick={() => {
          setOpen((v) => !v);
          void load();
        }}
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <div className="border-b border-border px-3 py-2 text-sm font-medium">
            Notifications
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                No notifications yet
              </li>
            ) : (
              items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="w-full px-3 py-2.5 text-left hover:bg-muted/50"
                    onClick={() => {
                      void markRead(item.id);
                      if (item.href) window.location.href = item.href;
                      setOpen(false);
                    }}
                  >
                    <p
                      className={
                        item.read_at
                          ? "text-sm text-muted-foreground"
                          : "text-sm font-medium"
                      }
                    >
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.body}
                    </p>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
