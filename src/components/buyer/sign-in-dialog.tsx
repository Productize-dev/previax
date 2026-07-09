"use client";

import Link from "next/link";
import { useState } from "react";

import { PreviaxLogo } from "@/components/layout/previax-logo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type SignInDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SignInDialog({ open, onOpenChange }: SignInDialogProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState<"password" | "magic" | null>(null);
  const [error, setError] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  function resetFeedback() {
    setError("");
    setMagicLinkSent(false);
  }

  async function handlePasswordSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    resetFeedback();
    setPending("password");

    const { error: signInError } =
      await getSupabaseBrowserClient().auth.signInWithPassword({
        email,
        password,
      });

    setPending(null);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    onOpenChange(false);
    setEmail("");
    setPassword("");
  }

  async function handleMagicLink() {
    if (!email) {
      setError("Enter your email first to receive a magic link.");
      return;
    }
    resetFeedback();
    setPending("magic");

    const { error: otpError } =
      await getSupabaseBrowserClient().auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="items-center text-center">
          <PreviaxLogo height={72} asLink={false} className="mx-auto" />
          <DialogTitle>Welcome to Previax</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Sign in to save communities and personalize your experience.
        </p>
        <form onSubmit={handlePasswordSignIn} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="signin-email">Email</Label>
            <Input
              id="signin-email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signin-password">Password</Label>
            <Input
              id="signin-password"
              name="password"
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
            onClick={() => onOpenChange(false)}
          >
            Create an account
          </Link>
        </p>
      </DialogContent>
    </Dialog>
  );
}
