"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Building2, Compass, Landmark } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

type SignupRole = Exclude<UserRole, "admin">;

const ROLE_OPTIONS: Array<{
  value: SignupRole;
  label: string;
  description: string;
  icon: typeof Compass;
}> = [
  {
    value: "buyer",
    label: "Home buyer",
    description: "Browse communities and save your favorites.",
    icon: Compass,
  },
  {
    value: "builder",
    label: "Builder",
    description: "Manage communities and home models. Requires approval.",
    icon: Building2,
  },
  {
    value: "lender",
    label: "Lender",
    description: "Publish financing offers. Requires approval.",
    icon: Landmark,
  },
];

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<SignupRole>("buyer");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [confirmationSent, setConfirmationSent] = useState(false);

  const needsCompany = role === "builder" || role === "lender";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setPending(true);

    const { data, error: signUpError } =
      await getSupabaseBrowserClient().auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: {
            full_name: fullName,
            company_name: needsCompany ? companyName : undefined,
            role,
          },
        },
      });

    setPending(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      // Confirmación de email desactivada: sesión inmediata.
      router.push(role === "buyer" ? "/" : "/pending-approval");
      router.refresh();
      return;
    }
    setConfirmationSent(true);
  }

  if (confirmationSent) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="font-heading text-2xl">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          We sent a confirmation link to{" "}
          <span className="text-foreground">{email}</span>. Click it to
          activate your account.
        </p>
        {role !== "buyer" && (
          <p className="text-sm text-muted-foreground">
            Your {role} account will stay{" "}
            <span className="text-foreground">pending</span> until a Previax
            admin approves it.
          </p>
        )}
        <Button
          variant="outline"
          className="w-full"
          render={<Link href="/login" />}
        >
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose how you&apos;ll use Previax.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-2">
          {ROLE_OPTIONS.map(({ value, label, description, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setRole(value)}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                role === value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50",
              )}
            >
              <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>
                <span className="block text-sm font-medium">{label}</span>
                <span className="block text-xs text-muted-foreground">
                  {description}
                </span>
              </span>
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-name">Full name</Label>
          <Input
            id="signup-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        {needsCompany && (
          <div className="space-y-2">
            <Label htmlFor="signup-company">Company name</Label>
            <Input
              id="signup-company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="signup-email">Email</Label>
          <Input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-password">Password</Label>
          <Input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
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
