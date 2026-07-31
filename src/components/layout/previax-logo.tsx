import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

/** Intrinsic size of `/previax-logo.png` (icon + PREVIAX wordmark). */
const LOGO_WIDTH = 1024;
const LOGO_HEIGHT = 576;

type PreviaxLogoProps = {
  className?: string;
  /** Display height in CSS pixels; width follows the wordmark aspect ratio. */
  height?: number;
  asLink?: boolean;
};

export function PreviaxLogo({
  className,
  height = 36,
  asLink = true,
}: PreviaxLogoProps) {
  const width = Math.round((height * LOGO_WIDTH) / LOGO_HEIGHT);

  const logo = (
    <Image
      src="/previax-logo.png"
      alt="Previax"
      width={width}
      height={height}
      className={cn("shrink-0 object-contain object-left", className)}
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
