"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { User } from "lucide-react";

import { PreviaxLogo } from "@/components/layout/previax-logo";
import { APP_HOME, MARKETING_HOME } from "@/lib/routes";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#communities", label: "Communities" },
  { href: "#builders", label: "Builders" },
  { href: "#lenders", label: "Lenders" },
] as const;

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled
          ? "bg-black/90 backdrop-blur-md"
          : "bg-gradient-to-b from-black/80 via-black/30 to-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-6 lg:h-[72px]">
        <PreviaxLogo
          href={MARKETING_HOME}
          height={40}
          className="brightness-110"
        />

        <nav className="ml-2 hidden flex-1 items-center justify-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-white/85 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Link
            href={APP_HOME}
            className="rounded-md border border-primary px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-primary/15 sm:px-4 sm:py-2"
          >
            Start Here
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-white/15 sm:px-4 sm:py-2"
          >
            <User className="size-3.5" />
            <span className="hidden sm:inline">Sign In</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
