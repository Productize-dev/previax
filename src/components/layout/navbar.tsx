"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Search, User } from "lucide-react";

import { SignInDialog } from "@/components/buyer/sign-in-dialog";
import { PreviaxLogo } from "@/components/layout/previax-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBuyer } from "@/context/buyer-context";
import { cn } from "@/lib/utils";

type NavbarProps = {
  overlay?: boolean;
};

export function Navbar({ overlay = false }: NavbarProps) {
  const {
    searchQuery,
    setSearchQuery,
    savedIds,
    buyer,
    signOut,
  } = useBuyer();
  const [signInOpen, setSignInOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!overlay) return;
    function onScroll() {
      setScrolled(window.scrollY > 48);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overlay]);

  const isTransparent = overlay && !scrolled;

  return (
    <>
      <nav
        className={cn(
          "z-50 transition-all duration-300",
          overlay
            ? cn(
                "fixed inset-x-0 top-0",
                isTransparent
                  ? "border-transparent bg-transparent"
                  : "border-b border-border/50 bg-background/90 backdrop-blur-md",
              )
            : "sticky top-0 border-b border-border/50 bg-background/80 backdrop-blur-md",
        )}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <PreviaxLogo height={40} />

            {!overlay && (
              <div className="hidden flex-1 max-w-md md:block">
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search communities, cities, builders..."
                    className="rounded-full pl-9"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-1 sm:gap-2">
              <Link href="/saved" className="relative">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Saved"
                  className={cn(isTransparent && "text-foreground hover:bg-white/10")}
                >
                  <Heart className="size-4" />
                </Button>
                {savedIds.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                    {savedIds.length}
                  </span>
                )}
              </Link>
              {buyer ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={signOut}
                  className={cn(
                    isTransparent &&
                      "border-white/30 bg-white/10 text-foreground hover:bg-white/20",
                  )}
                >
                  {buyer.name.split(" ")[0]}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSignInOpen(true)}
                  className={cn(
                    isTransparent &&
                      "border-white/30 bg-white/10 text-foreground hover:bg-white/20",
                  )}
                >
                  <User className="size-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </Button>
              )}
            </div>
          </div>

          {!overlay && (
            <div className="relative md:hidden">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search communities..."
                className="rounded-full pl-9"
              />
            </div>
          )}
        </div>
      </nav>
      <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
    </>
  );
}
