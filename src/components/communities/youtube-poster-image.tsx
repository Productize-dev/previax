"use client";

import { useEffect, useMemo, useState } from "react";

import { getYouTubePosterCandidates } from "@/lib/community-media";
import { cn } from "@/lib/utils";

type YouTubePosterImageProps = {
  videoUrl?: string | null;
  fallbackUrl?: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
};

export function YouTubePosterImage({
  videoUrl,
  fallbackUrl,
  alt = "",
  className,
  imgClassName,
  loading = "lazy",
  fetchPriority,
}: YouTubePosterImageProps) {
  const candidates = useMemo(() => {
    if (videoUrl) {
      return getYouTubePosterCandidates(videoUrl);
    }
    return fallbackUrl ? [fallbackUrl] : [];
  }, [fallbackUrl, videoUrl]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [videoUrl, fallbackUrl]);

  const src = candidates[index] ?? fallbackUrl;

  if (!src) {
    return <div className={cn("bg-[#1a1a1a]", className)} />;
  }

  return (
    <div className={cn("overflow-hidden bg-[#1a1a1a]", className)}>
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        fetchPriority={fetchPriority}
        className={cn("size-full object-cover", imgClassName)}
        onError={() => {
          if (index < candidates.length - 1) {
            setIndex((current) => current + 1);
            return;
          }
          if (fallbackUrl && src !== fallbackUrl) {
            setIndex(candidates.length);
          }
        }}
      />
    </div>
  );
}
