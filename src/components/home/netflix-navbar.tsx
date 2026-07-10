"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, Search } from "lucide-react";

import { NetflixSearchOverlay } from "@/components/home/netflix-search-overlay";
import { UserMenu } from "@/components/home/user-menu";
import { PreviaxLogo } from "@/components/layout/previax-logo";
import { useProfile } from "@/context/auth-context";
import { useBuyer } from "@/context/buyer-context";
import { canAccessDashboard } from "@/lib/auth/profile";
import { cn } from "@/lib/utils";

const SECTION_LINKS = [
  { hash: "home", label: "Home" },
  { hash: "tags", label: "Tags" },
  { hash: "houses", label: "Houses" },
  { hash: "communities", label: "Communities" },
  { hash: "cities", label: "Cities" },
] as const;

function getActiveHash(pathname: string, hash: string): string {
  if (pathname !== "/") return "";
  const normalized = hash.replace("#", "");
  return normalized || "home";
}

export function NetflixNavbar() {
  const pathname = usePathname();
  const { savedIds, savedHomeRefs } = useBuyer();
  const profile = useProfile();
  const showDashboard = canAccessDashboard(profile);
  const [scrolled, setScrolled] = useState(false);
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [activeHash, setActiveHash] = useState("home");

  const listCount = savedIds.length + savedHomeRefs.length;

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function updateHash() {
      setActiveHash(getActiveHash(pathname, window.location.hash));
    }
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, [pathname]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
          scrolled
            ? "bg-[#141414]"
            : "bg-gradient-to-b from-black/80 via-black/40 to-transparent",
        )}
      >
        <div className="mx-auto flex h-16 items-center gap-4 px-[4%] lg:h-[68px] lg:gap-6">
          <Link href="/#home" className="shrink-0" aria-label="Previax home">
            <PreviaxLogo
              height={32}
              className="brightness-110"
              asLink={false}
            />
          </Link>

          <nav className="flex min-w-0 flex-1 items-center gap-4 overflow-x-auto lg:gap-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SECTION_LINKS.map(({ hash, label }) => {
              const active = pathname === "/" && activeHash === hash;

              return (
                <Link
                  key={hash}
                  href={`/#${hash}`}
                  className={cn(
                    "shrink-0 text-sm text-[#e5e5e5] transition-colors hover:text-white/70",
                    active && "font-semibold text-white",
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            {showDashboard && (
              <Link
                href="/dashboard"
                className={cn(
                  "hidden shrink-0 rounded px-2.5 py-1.5 text-sm text-[#e5e5e5] transition-colors hover:text-white sm:inline-block",
                  pathname === "/dashboard" && "font-semibold text-white",
                )}
              >
                Dashboard
              </Link>
            )}

            <button
              type="button"
              aria-label="Open smart search"
              onClick={() => setSearchOverlayOpen(true)}
              className="shrink-0 text-white transition-colors hover:text-white/70"
            >
              <Search className="size-5" />
            </button>

            <Link
              href="/saved"
              className="relative hidden text-white transition-colors hover:text-white/70 sm:block"
              aria-label="My List"
            >
              <Heart className="size-5" />
              {listCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-sm bg-[#e50914] text-[10px] font-bold text-white">
                  {listCount > 9 ? "9+" : listCount}
                </span>
              )}
            </Link>

            <UserMenu />
          </div>
        </div>
      </header>

      <NetflixSearchOverlay
        open={searchOverlayOpen}
        onOpenChange={setSearchOverlayOpen}
      />
    </>
  );
}
