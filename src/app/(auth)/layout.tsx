import Link from "next/link";

import { PreviaxLogo } from "@/components/layout/previax-logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#e50914]/10 via-transparent to-transparent"
      />
      <Link href="/" className="relative mb-8">
        <PreviaxLogo height={56} asLink={false} />
      </Link>
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card/70 p-8 backdrop-blur">
        {children}
      </div>
      <Link
        href="/"
        className="relative mt-6 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Back to Previax
      </Link>
    </div>
  );
}
