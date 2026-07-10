"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, ThumbsUp, User } from "lucide-react";

import { SignInDialog } from "@/components/buyer/sign-in-dialog";
import { NetflixNavbar } from "@/components/home/netflix-navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { useBuyer } from "@/context/buyer-context";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { toastError, toastSuccess } from "@/lib/toast";

export default function AccountPage() {
  const router = useRouter();
  const { user, profile, isLoaded, refreshProfile } = useAuth();
  const {
    buyer,
    savedIds,
    savedHomeRefs,
    likedCommunityIds,
    likedHomeRefs,
    guidancePrefs,
    viewedCities,
  } = useBuyer();
  const [signInOpen, setSignInOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  useEffect(() => {
    if (isLoaded && !user) setSignInOpen(true);
  }, [isLoaded, user]);

  useEffect(() => {
    setFullName(profile?.fullName ?? buyer?.name ?? "");
  }, [profile?.fullName, buyer?.name]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const trimmed = fullName.trim();
    const { error } = await getSupabaseBrowserClient()
      .from("profiles")
      .update({ full_name: trimmed || null })
      .eq("id", user.id);

    setSaving(false);
    if (error) {
      toastError(error.message || "Could not update profile");
      return;
    }

    await refreshProfile();
    toastSuccess("Profile updated");
  }

  async function handlePasswordReset() {
    const email = profile?.email ?? user?.email;
    if (!email) return;
    setResettingPassword(true);

    const { error } = await getSupabaseBrowserClient().auth.resetPasswordForEmail(
      email,
      { redirectTo: `${window.location.origin}/auth/confirm` },
    );

    setResettingPassword(false);
    if (error) {
      toastError(error.message || "Could not send reset email");
      return;
    }
    toastSuccess("Password reset email sent");
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#141414] text-white">
        <NetflixNavbar />
        <main className="flex min-h-[60vh] items-center justify-center pt-20">
          <p className="text-[#b3b3b3]">Loading...</p>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#141414] text-white">
        <NetflixNavbar />
        <main className="mx-auto max-w-lg px-[4%] py-24 text-center">
          <User className="mx-auto size-12 text-[#808080]" />
          <h1 className="mt-4 text-2xl font-semibold">Your account</h1>
          <p className="mt-2 text-[#b3b3b3]">
            Sign in to manage your profile and sync preferences across devices.
          </p>
          <Button className="mt-6" onClick={() => setSignInOpen(true)}>
            Sign in
          </Button>
        </main>
        <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
      </div>
    );
  }

  const listCount = savedIds.length + savedHomeRefs.length;
  const likesCount = likedCommunityIds.length + likedHomeRefs.length;

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <NetflixNavbar />

      <main className="mx-auto max-w-3xl px-[4%] pb-20 pt-24">
        <h1 className="text-3xl font-bold">Account</h1>
        <p className="mt-2 text-[#b3b3b3]">
          Manage your profile, password, and browsing preferences.
        </p>

        <section className="mt-10 rounded-lg border border-white/10 bg-[#181818] p-6">
          <h2 className="text-lg font-semibold">Profile</h2>
          <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-[#e5e5e5]">
                Display name
              </Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="border-white/20 bg-[#333] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#e5e5e5]">
                Email
              </Label>
              <Input
                id="email"
                value={profile?.email ?? user.email ?? ""}
                readOnly
                className="border-white/10 bg-[#222] text-[#b3b3b3]"
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </form>
        </section>

        <section className="mt-6 rounded-lg border border-white/10 bg-[#181818] p-6">
          <h2 className="text-lg font-semibold">Password</h2>
          <p className="mt-2 text-sm text-[#b3b3b3]">
            We&apos;ll email you a secure link to choose a new password.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4 border-white/20 bg-transparent text-white hover:bg-white/10"
            disabled={resettingPassword}
            onClick={() => void handlePasswordReset()}
          >
            {resettingPassword ? "Sending..." : "Send password reset email"}
          </Button>
        </section>

        <section className="mt-6 rounded-lg border border-white/10 bg-[#181818] p-6">
          <h2 className="text-lg font-semibold">Your library</h2>
          <p className="mt-2 text-sm text-[#b3b3b3]">
            Saved items live in this browser. Sign in keeps your account; lists
            sync when we add cloud saves.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link
              href="/saved?tab=list"
              className="flex items-center gap-3 rounded-md border border-white/10 bg-[#222] px-4 py-3 transition-colors hover:bg-[#2a2a2a]"
            >
              <Heart className="size-5 text-[#e50914]" />
              <div>
                <p className="font-medium">My List</p>
                <p className="text-sm text-[#b3b3b3]">{listCount} saved</p>
              </div>
            </Link>
            <Link
              href="/saved?tab=likes"
              className="flex items-center gap-3 rounded-md border border-white/10 bg-[#222] px-4 py-3 transition-colors hover:bg-[#2a2a2a]"
            >
              <ThumbsUp className="size-5" />
              <div>
                <p className="font-medium">Liked</p>
                <p className="text-sm text-[#b3b3b3]">{likesCount} liked</p>
              </div>
            </Link>
          </div>
        </section>

        {(guidancePrefs || viewedCities.length > 0) && (
          <section className="mt-6 rounded-lg border border-white/10 bg-[#181818] p-6">
            <h2 className="text-lg font-semibold">Search preferences</h2>
            {guidancePrefs && (
              <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
                {guidancePrefs.budget && (
                  <div>
                    <dt className="text-[#808080]">Budget</dt>
                    <dd>{guidancePrefs.budget}</dd>
                  </div>
                )}
                {guidancePrefs.city && (
                  <div>
                    <dt className="text-[#808080]">City</dt>
                    <dd>{guidancePrefs.city}</dd>
                  </div>
                )}
                {guidancePrefs.beds && (
                  <div>
                    <dt className="text-[#808080]">Bedrooms</dt>
                    <dd>{guidancePrefs.beds}</dd>
                  </div>
                )}
              </dl>
            )}
            {viewedCities.length > 0 && (
              <p className="mt-4 text-sm text-[#b3b3b3]">
                Recently viewed cities: {viewedCities.join(", ")}
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              className="mt-4 border-white/20 bg-transparent text-white hover:bg-white/10"
              onClick={() => router.push("/guidance")}
            >
              Update preferences
            </Button>
          </section>
        )}
      </main>
    </div>
  );
}
