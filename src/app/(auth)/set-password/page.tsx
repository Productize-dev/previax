"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getPostAuthPath,
  mapProfileRow,
  PROFILE_COLUMNS,
  type ProfileRow,
} from "@/lib/auth/profile";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * After an invite / recovery / magic link, the agent lands here to choose a
 * password so future Sign in works with email + password.
 */
export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    void getSupabaseBrowserClient()
      .auth.getUser()
      .then(({ data }) => {
        if (!data.user) {
          router.replace("/login?error=invite_required");
          return;
        }
        setEmail(data.user.email ?? null);
        setReady(true);
      });
  }, [router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    const supabase = getSupabaseBrowserClient();
    const { data: userData, error: updateError } =
      await supabase.auth.updateUser({ password });

    if (updateError || !userData.user) {
      setPending(false);
      setError(updateError?.message ?? "Could not save password");
      return;
    }

    const { data: profileRow } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", userData.user.id)
      .maybeSingle();

    const profile = profileRow
      ? mapProfileRow(profileRow as ProfileRow)
      : null;

    router.push(getPostAuthPath(profile));
    router.refresh();
  }

  if (!ready) {
    return (
      <p className="text-sm text-muted-foreground">Checking your invite…</p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl">Set your password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {email
            ? `Finish activating ${email} so you can sign in next time.`
            : "Choose a password for your Previax sales account."}
        </p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Saving…" : "Save password & continue"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already set a password?{" "}
        <Link
          href="/login"
          className="text-foreground underline underline-offset-4 hover:text-primary"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
