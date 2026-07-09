"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState<"password" | "magic" | null>(null);
  const [error, setError] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  async function destinationFor(userId: string): Promise<string> {
    const { data } = await getSupabaseBrowserClient()
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", userId)
      .maybeSingle();
    const profile = data ? mapProfileRow(data as ProfileRow) : null;
    return getPostAuthPath(profile, next);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMagicLinkSent(false);
    setPending("password");

    const { data, error: signInError } =
      await getSupabaseBrowserClient().auth.signInWithPassword({
        email,
        password,
      });

    if (signInError) {
      setPending(null);
      setError(signInError.message);
      return;
    }

    router.push(await destinationFor(data.user.id));
    router.refresh();
  }

  async function handleMagicLink() {
    if (!email) {
      setError("Enter your email first to receive a magic link.");
      return;
    }
    setError("");
    setPending("magic");

    const { error: otpError } =
      await getSupabaseBrowserClient().auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm${
            next ? `?next=${encodeURIComponent(next)}` : ""
          }`,
        },
      });

    setPending(null);
    if (otpError) {
      setError(otpError.message);
      return;
    }
    setMagicLinkSent(true);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back — enter your details below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="login-password">Password</Label>
          <Input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {magicLinkSent && (
          <p className="text-sm text-primary">
            Magic link sent — check your inbox to finish signing in.
          </p>
        )}

        <Button type="submit" className="w-full" disabled={pending !== null}>
          {pending === "password" ? "Signing in..." : "Sign In"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={pending !== null}
          onClick={handleMagicLink}
        >
          {pending === "magic" ? "Sending..." : "Email me a magic link"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        New to Previax?{" "}
        <Link
          href="/signup"
          className="text-foreground underline underline-offset-4 hover:text-primary"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
