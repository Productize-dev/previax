import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type PreviaxLogoProps = {
  className?: string;
  height?: number;
  asLink?: boolean;
};

export function PreviaxLogo({
  className,
  height = 44,
  asLink = true,
}: PreviaxLogoProps) {
  const logo = (
    <Image
      src="/previax-logo.png"
      alt="Previax"
      width={height}
      height={height}
      className={cn("shrink-0 object-contain", className)}
      priority
    />
  );

  if (asLink) {
    return (
      <Link href="/" className="inline-flex shrink-0" aria-label="Previax home">
        {logo}
      </Link>
    );
  }

  return logo;
}
