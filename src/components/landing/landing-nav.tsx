"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PreviaxLogo } from "@/components/layout/previax-logo";
import { MARKETING_HOME } from "@/lib/routes";
import { cn } from "@/lib/utils";

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
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 lg:h-[72px]">
        <PreviaxLogo href={MARKETING_HOME} height={48} className="brightness-110" />
        <Link
          href="/login"
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Sign In
        </Link>
      </div>
    </header>
  );
}
