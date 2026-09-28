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
import { APP_HOME, MARKETING_HOME } from "@/lib/routes";
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
  const [activeId, setActiveId] = useState("home");

  const listCount = savedIds.length + savedHomeRefs.length;
  const onBrowse = pathname === APP_HOME;

  const sectionLinks = useMemo(
    () => buildHomepageNavLinks(homepageSections),
    [homepageSections],
  );

  const navLinks = useMemo(() => {
    if (!onBrowse) return sectionLinks;
    return [
      { id: "home", label: "Home", href: `${APP_HOME}#home` },
      ...sectionLinks,
    ];
  }, [onBrowse, sectionLinks]);

  const hashLinks = useMemo(
    () =>
      navLinks.filter(
        (link) =>
          link.href.startsWith(`${APP_HOME}#`) && link.id !== "home",
      ),
    [navLinks],
  );

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!onBrowse) {
      setActiveId("");
      return;
    }

    function syncFromHash() {
      const hash = window.location.hash.replace("#", "");
      if (hash) setActiveId(hash);
      else if (window.scrollY < 120) setActiveId("home");
    }

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);

    const targets = hashLinks
      .map((link) => document.getElementById(link.id))
      .filter((el): el is HTMLElement => Boolean(el));

    const observer = new IntersectionObserver(
      (entries) => {
        if (window.scrollY < 120) {
          setActiveId("home");
          return;
        }
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-18% 0px -55% 0px",
        threshold: [0.1, 0.25, 0.5],
      },
    );

    for (const target of targets) observer.observe(target);

    return () => {
      window.removeEventListener("hashchange", syncFromHash);
      observer.disconnect();
    };
  }, [onBrowse, hashLinks]);

  function isActive(linkId: string, href: string): boolean {
    if (href === "/saved" || linkId === "my-list") {
      return pathname.startsWith("/saved");
    }
    if (!onBrowse) return false;
    return activeId === linkId;
  }

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-300",
          scrolled || mobileOpen
            ? "bg-black/95 shadow-[0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md"
            : "bg-gradient-to-b from-black/75 via-black/30 to-transparent",
        )}
      >
        <div
          className={cn(
            "mx-auto flex items-center gap-4 px-[4%] transition-[height] duration-300 lg:gap-7",
            scrolled ? "h-12 lg:h-[52px]" : "h-16 lg:h-16",
          )}
        >
          <Link
            href={APP_HOME}
            className="shrink-0 transition-opacity hover:opacity-90"
            aria-label="Previax home"
          >
            <PreviaxLogo
              height={scrolled ? 48 : 56}
              className="brightness-110"
              asLink={false}
            />
          </Link>

          <nav
            className="hidden min-w-0 flex-1 items-center gap-0.5 lg:flex"
            aria-label="Primary"
          >
            {navLinks.map((link) => {
              const active = isActive(link.id, link.href);
              return (
                <Link
                  key={link.id}
                  href={link.href}
                  className={cn(
                    "rounded px-2.5 py-1 text-[0.8125rem] transition-colors",
                    active
                      ? "font-semibold text-white"
                      : "font-normal text-[#e5e5e5] hover:text-white/70",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Link
              href={MARKETING_HOME}
              className="mr-0.5 hidden rounded px-2.5 py-1 text-[0.8125rem] text-[#e5e5e5] transition-colors hover:text-white sm:inline-block"
            >
              Welcome
            </Link>

            {showDashboard && (
              <Link
                href="/dashboard"
                className={cn(
                  "mr-1 hidden rounded px-2.5 py-1 text-[0.8125rem] text-[#e5e5e5] transition-colors hover:text-white sm:inline-block",
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
              className="flex size-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
            >
              <Search className="size-[1.15rem]" strokeWidth={1.75} />
            </button>

            <Link
              href="/saved"
              className="relative flex size-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
              aria-label="My List"
            >
              <Heart className="size-[1.15rem]" strokeWidth={1.75} />
              {listCount > 0 && (
                <span className="absolute top-1 right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#e50914] px-0.5 text-[9px] font-bold leading-none text-white">
                  {listCount > 9 ? "9+" : listCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 lg:hidden"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((open) => !open)}
            >
              {mobileOpen ? (
                <X className="size-5" strokeWidth={1.75} />
              ) : (
                <Menu className="size-5" strokeWidth={1.75} />
              )}
            </button>

            <div className="ml-0.5 sm:ml-1">
              <UserMenu />
            </div>
          </div>
        </div>

        {mobileOpen && (
          <nav
            className="max-h-[min(70vh,28rem)] overflow-y-auto border-t border-white/10 bg-black/98 px-[4%] py-3 shadow-2xl lg:hidden"
            aria-label="Mobile"
          >
            <ul className="flex flex-col gap-0.5">
              <li>
                <Link
                  href={MARKETING_HOME}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-md px-3 py-3 text-[0.95rem] text-[#e5e5e5] transition-colors hover:bg-white/5 hover:text-white"
                >
                  Welcome
                </Link>
              </li>
              {navLinks.map((link) => {
                const active = isActive(link.id, link.href);
                return (
                  <li key={link.id}>
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "block rounded-md px-3 py-3 text-[0.95rem] transition-colors",
                        active
                          ? "bg-white/10 font-semibold text-white"
                          : "text-[#e5e5e5] hover:bg-white/5 hover:text-white",
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
              {showDashboard && (
                <li>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "block rounded-md px-3 py-3 text-[0.95rem] transition-colors",
                      pathname === "/dashboard"
                        ? "bg-white/10 font-semibold text-white"
                        : "text-[#e5e5e5] hover:bg-white/5 hover:text-white",
                    )}
                  >
                    Dashboard
                  </Link>
                </li>
              )}
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
