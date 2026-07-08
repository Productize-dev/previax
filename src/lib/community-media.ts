import { getYouTubeThumbnailUrl, isValidYouTubeUrl, isYouTubeThumbnailUrl } from "@/lib/youtube";
import type { Community, Home } from "@/lib/types";

export function getAvailableModels(community: Community): Home[] {
  return community.homes.filter((home) => home.status !== "sold");
}

export function getHomeVideoUrl(home: Home, community: Community): string | null {
  if (home.youtubeUrl?.trim() && isValidYouTubeUrl(home.youtubeUrl)) {
    return home.youtubeUrl.trim();
  }

  if (community.youtubeUrl?.trim() && isValidYouTubeUrl(community.youtubeUrl)) {
    return community.youtubeUrl.trim();
  }

  return null;
}

export function getCommunityHeroVideoUrl(community: Community): string | null {
  if (community.youtubeUrl?.trim() && isValidYouTubeUrl(community.youtubeUrl)) {
    return community.youtubeUrl.trim();
  }
  return null;
}

/** Best-effort YouTube poster — prefers maxres, caller should fall back on error. */
export function getYouTubePosterCandidates(videoUrl: string): string[] {
  const maxres = getYouTubeThumbnailUrl(videoUrl, "maxres");
  const hq = getYouTubeThumbnailUrl(videoUrl, "hq");
  const mq = getYouTubeThumbnailUrl(videoUrl, "mq");

  return [...new Set([maxres, hq, mq].filter(Boolean))] as string[];
}

export function getCommunityHeroPosterUrl(community: Community): string {
  const videoUrl = getCommunityHeroVideoUrl(community);
  if (videoUrl) {
    const [primary] = getYouTubePosterCandidates(videoUrl);
    if (primary) return primary;
  }

  return community.thumbnailUrl;
}

export function getHomePosterUrl(home: Home, community: Community): string {
  const customImage = getCustomHomeImage(home, community);
  if (customImage) return customImage;

  const videoUrl = getHomeVideoUrl(home, community);
  if (videoUrl) {
    const [primary] = getYouTubePosterCandidates(videoUrl);
    if (primary) return primary;
  }

  return community.thumbnailUrl ?? "";
}

export function getCustomHomeImage(
  home: Home,
  community: Community,
): string | null {
  for (const url of home.imageUrls) {
    const trimmed = url.trim();
    if (!trimmed) continue;
    if (isYouTubeThumbnailUrl(trimmed)) continue;
    if (trimmed === community.thumbnailUrl?.trim()) continue;
    return trimmed;
  }
  return null;
}

export function getModelPosterSources(
  home: Home,
  community: Community,
): { videoUrl: string | null; fallbackUrl: string } {
  const customImage = getCustomHomeImage(home, community);
  if (customImage) {
    return { videoUrl: null, fallbackUrl: customImage };
  }

  return {
    videoUrl: getHomeVideoUrl(home, community),
    fallbackUrl: getHomePosterUrl(home, community),
  };
}

export function getHomeDisplayName(home: Home, index: number): string {
  return home.modelName?.trim() || `Model ${index + 1}`;
}

export function formatModelMeta(home: Home): string {
  const parts: string[] = [];

  if (home.bedrooms > 0) {
    parts.push(`${home.bedrooms} bd`);
  }
  if (home.bathrooms > 0) {
    parts.push(`${home.bathrooms} ba`);
  }
  if (home.sqft > 0) {
    parts.push(`${home.sqft.toLocaleString()} sqft`);
  }
  if (home.price > 0) {
    parts.push(`$${home.price.toLocaleString()}`);
  }

  return parts.length > 0 ? parts.join(" · ") : "Video tour";
}
