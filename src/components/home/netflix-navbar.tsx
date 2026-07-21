"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Heart, Menu, Search, X } from "lucide-react";

import { NetflixSearchOverlay } from "@/components/home/netflix-search-overlay";
import { UserMenu } from "@/components/home/user-menu";
import { PreviaxLogo } from "@/components/layout/previax-logo";
import { useProfile } from "@/context/auth-context";
import { useBuyer } from "@/context/buyer-context";
import { useData } from "@/context/data-context";
import { canAccessDashboard } from "@/lib/auth/profile";
import { buildHomepageNavLinks } from "@/lib/homepage-nav";
import { cn } from "@/lib/utils";

export function NetflixNavbar() {
  const pathname = usePathname();
  const { homepageSections } = useData();
  const { savedIds, savedHomeRefs } = useBuyer();
  const profile = useProfile();
  const showDashboard = canAccessDashboard(profile);
  const [scrolled, setScrolled] = useState(false);
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeId, setActiveId] = useState("");

  const listCount = savedIds.length + savedHomeRefs.length;

  const navLinks = useMemo(
    () => buildHomepageNavLinks(homepageSections),
    [homepageSections],
  );

  const hashLinks = useMemo(
    () => navLinks.filter((link) => link.href.startsWith("/#")),
    [navLinks],
  );

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (pathname !== "/") {
      setActiveId("");
      return;
    }

    function syncFromHash() {
      const hash = window.location.hash.replace("#", "");
      if (hash) setActiveId(hash);
    }

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);

    const targets = hashLinks
      .map((link) => document.getElementById(link.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (targets.length === 0) {
      return () => window.removeEventListener("hashchange", syncFromHash);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0.1, 0.25, 0.5],
      },
    );

    for (const target of targets) observer.observe(target);

    return () => {
      window.removeEventListener("hashchange", syncFromHash);
      observer.disconnect();
    };
  }, [pathname, hashLinks]);

  function isActive(linkId: string, href: string): boolean {
    if (href === "/saved") return pathname.startsWith("/saved");
    return pathname === "/" && activeId === linkId;
  }

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
          scrolled || mobileOpen
            ? "bg-[#141414]"
            : "bg-gradient-to-b from-black/80 via-black/40 to-transparent",
        )}
      >
        <div className="mx-auto flex h-16 items-center gap-3 px-[4%] lg:h-[68px] lg:gap-6">
          <Link href="/" className="shrink-0" aria-label="Previax home">
            <PreviaxLogo
              height={32}
              className="brightness-110"
              asLink={false}
            />
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center gap-5 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className={cn(
                  "shrink-0 text-sm text-[#e5e5e5] transition-colors hover:text-white/70",
                  isActive(link.id, link.href) && "font-semibold text-white",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-4">
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
              className="relative text-white transition-colors hover:text-white/70"
              aria-label="My List"
            >
              <Heart className="size-5" />
              {listCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-sm bg-[#e50914] text-[10px] font-bold text-white">
                  {listCount > 9 ? "9+" : listCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              className="text-white md:hidden"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((open) => !open)}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>

            <UserMenu />
          </div>
        </div>

        {mobileOpen && (
          <nav className="border-t border-white/10 px-[4%] py-3 md:hidden">
            <ul className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <li key={link.id}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "block rounded-md px-2 py-2.5 text-sm text-[#e5e5e5] transition-colors hover:bg-white/5 hover:text-white",
                      isActive(link.id, link.href) &&
                        "bg-white/10 font-semibold text-white",
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>

      <NetflixSearchOverlay
        open={searchOverlayOpen}
        onOpenChange={setSearchOverlayOpen}
      />
    </>
  );
}
