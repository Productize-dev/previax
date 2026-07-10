"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bookmark,
  Heart,
  LogOut,
  Settings,
  ThumbsUp,
  User,
} from "lucide-react";

import { SignInDialog } from "@/components/buyer/sign-in-dialog";
import { useProfile } from "@/context/auth-context";
import { useBuyer } from "@/context/buyer-context";
import { canAccessDashboard } from "@/lib/auth/profile";
import { cn } from "@/lib/utils";

type UserMenuProps = {
  className?: string;
};

export function UserMenu({ className }: UserMenuProps) {
  const router = useRouter();
  const profile = useProfile();
  const {
    buyer,
    signOut,
    savedIds,
    savedHomeRefs,
    likedCommunityIds,
    likedHomeRefs,
  } = useBuyer();
  const showDashboard = canAccessDashboard(profile);
  const [open, setOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const listCount = savedIds.length + savedHomeRefs.length;
  const likesCount = likedCommunityIds.length + likedHomeRefs.length;

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  if (!buyer) {
    return (
      <>
        <button
          type="button"
          onClick={() => setSignInOpen(true)}
          className={cn(
            "flex size-8 items-center justify-center rounded bg-[#333] text-white transition-colors hover:bg-[#444]",
            className,
          )}
          aria-label="Sign in"
        >
          <User className="size-4" />
        </button>
        <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
      </>
    );
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex size-8 items-center justify-center rounded bg-[#e50914] text-xs font-bold text-white ring-2 ring-transparent transition-all hover:ring-white/30"
        aria-label="Account menu"
        aria-expanded={open}
      >
        {buyer.name.charAt(0).toUpperCase()}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-md border border-white/10 bg-[#181818] py-1 shadow-2xl">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="truncate text-sm font-semibold text-white">{buyer.name}</p>
            <p className="truncate text-xs text-[#b3b3b3]">{buyer.email}</p>
          </div>

          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#e5e5e5] transition-colors hover:bg-white/10"
          >
            <Settings className="size-4" />
            Account settings
          </Link>

          <Link
            href="/saved?tab=list"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#e5e5e5] transition-colors hover:bg-white/10"
          >
            <Heart className="size-4" />
            My List
            {listCount > 0 && (
              <span className="ml-auto text-xs text-[#b3b3b3]">{listCount}</span>
            )}
          </Link>

          <Link
            href="/saved?tab=likes"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#e5e5e5] transition-colors hover:bg-white/10"
          >
            <ThumbsUp className="size-4" />
            Liked
            {likesCount > 0 && (
              <span className="ml-auto text-xs text-[#b3b3b3]">{likesCount}</span>
            )}
          </Link>

          <Link
            href="/saved?tab=homes"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#e5e5e5] transition-colors hover:bg-white/10"
          >
            <Bookmark className="size-4" />
            Saved homes
            {savedHomeRefs.length > 0 && (
              <span className="ml-auto text-xs text-[#b3b3b3]">
                {savedHomeRefs.length}
              </span>
            )}
          </Link>

          {showDashboard && (
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 border-t border-white/10 px-4 py-2.5 text-sm text-[#e5e5e5] transition-colors hover:bg-white/10"
            >
              Dashboard
            </Link>
          )}

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              void signOut().then(() => router.push("/"));
            }}
            className="flex w-full items-center gap-3 border-t border-white/10 px-4 py-2.5 text-left text-sm text-[#e5e5e5] transition-colors hover:bg-white/10"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
