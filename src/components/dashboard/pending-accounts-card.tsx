"use client";

import { UserCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useProfile } from "@/context/auth-context";
import {
  mapProfileRow,
  PROFILE_COLUMNS,
  type ProfileRow,
} from "@/lib/auth/profile";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Profile, UserStatus } from "@/lib/types";

/** Solo admin: aprueba o rechaza cuentas builder/lender pendientes. */
export function PendingAccountsCard() {
  const profile = useProfile();
  const isAdmin = profile?.role === "admin";

  const [pending, setPending] = useState<Profile[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;

    void getSupabaseBrowserClient()
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .then(({ data, error: loadError }) => {
        if (cancelled) return;
        if (loadError) {
          setError(loadError.message);
          return;
        }
        setPending(((data ?? []) as ProfileRow[]).map(mapProfileRow));
      });

    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  if (!isAdmin || pending.length === 0) return null;

  async function resolve(id: string, status: UserStatus) {
    setBusyId(id);
    setError("");
    const { error: updateError } = await getSupabaseBrowserClient()
      .from("profiles")
      .update({ status })
      .eq("id", id);
    setBusyId(null);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setPending((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <Card className="border-primary/40">
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="font-heading text-lg">
          Pending accounts
        </CardTitle>
        <UserCheck className="size-5 text-primary" />
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Builder and lender accounts waiting for approval.
        </p>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <ul className="space-y-2">
          {pending.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {item.fullName || item.email}
                  <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs uppercase tracking-wide text-muted-foreground">
                    {item.role}
                  </span>
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {item.companyName ? `${item.companyName} · ` : ""}
                  {item.email}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  size="sm"
                  disabled={busyId === item.id}
                  onClick={() => resolve(item.id, "active")}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={busyId === item.id}
                  onClick={() => resolve(item.id, "rejected")}
                >
                  Reject
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
