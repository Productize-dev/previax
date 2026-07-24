"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, Loader2, UserPlus } from "lucide-react";

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
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { toastError, toastSuccess } from "@/lib/toast";
import type { Profile } from "@/lib/types";
import { mapProfileRow, PROFILE_COLUMNS, type ProfileRow } from "@/lib/auth/profile";

export function SalesTeamManager() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [salesPeople, setSalesPeople] = useState<Profile[]>([]);
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);

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
        actionLink?: string;
        mode?: "invite" | "existing";
      };
      if (!res.ok) throw new Error(data.error ?? "Invite failed");

      if (data.actionLink) setLastInviteLink(data.actionLink);

      if (data.emailSent) {
        toastSuccess(
          `Invite email sent to ${email}. They must open that link (not Sign in) and set a password.`,
        );
      } else if (data.mode === "existing") {
        toastSuccess(
          `${email} already had an account — upgraded to sales. Share the invite link below so they can set a password.`,
        );
      } else {
        toastSuccess(`Sales access ready for ${email}`);
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
            Do not ask them to sign up first. You invite → they open the email
            link → they set a password → then they can Sign in. Going to Sign in
            before that fails because they have no password yet.
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
                Use this if the email is slow or landed in spam. Share it only
                with that person.
              </p>
              <p className="break-all font-mono text-xs">{lastInviteLink}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => void copyInviteLink()}>
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
            {salesPeople.map((person) => (
              <li
                key={person.id}
                className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
              >
                <span>
                  <span className="font-medium">
                    {person.fullName || "Unnamed"}
                  </span>
                  <span className="ml-2 text-muted-foreground">
                    {person.email}
                  </span>
                </span>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  {person.status}
                </span>
              </li>
            ))}
          </ul>
        )}
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
