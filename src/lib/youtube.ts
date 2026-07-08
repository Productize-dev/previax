export function extractYouTubeId(url: string): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url.trim());

    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.slice(1).split("/")[0] || null;
    }

    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.split("/")[2] || null;
      }
      if (parsed.pathname.startsWith("/shorts/")) {
        return parsed.pathname.split("/")[2] || null;
      }
      return parsed.searchParams.get("v");
    }
  } catch {
    return null;
  }

  return null;
}

export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}

/** YouTube-hosted poster for a video ID or URL. */
export function getYouTubeThumbnailUrl(
  videoIdOrUrl: string,
  quality: "hq" | "maxres" | "mq" = "hq",
): string | null {
  const id =
    videoIdOrUrl.length === 11 && !videoIdOrUrl.includes("/")
      ? videoIdOrUrl
      : extractYouTubeId(videoIdOrUrl);

  if (!id) return null;

  const file =
    quality === "maxres"
      ? "maxresdefault"
      : quality === "mq"
        ? "mqdefault"
        : "hqdefault";

  return `https://img.youtube.com/vi/${id}/${file}.jpg`;
}

export function isYouTubeThumbnailUrl(url: string): boolean {
  return /^https?:\/\/img\.youtube\.com\/vi\/[^/]+\//.test(url.trim());
}

export function resolveThumbnailFromYouTube(
  youtubeUrl: string,
  customThumbnail?: string,
): string {
  const trimmed = customThumbnail?.trim();
  if (trimmed) return trimmed;
  return getYouTubeThumbnailUrl(youtubeUrl) ?? "";
}

type EmbedOptions = {
  autoplay?: boolean;
  mute?: boolean;
  loop?: boolean;
  controls?: boolean;
};

export function getEmbedUrl(
  videoId: string,
  opts: EmbedOptions = {},
): string {
  const {
    autoplay = false,
    mute = false,
    loop = false,
    controls = true,
  } = opts;

  const params = new URLSearchParams();
  if (autoplay) params.set("autoplay", "1");
  if (mute) params.set("mute", "1");
  if (loop) {
    params.set("loop", "1");
    params.set("playlist", videoId);
  }
  if (!controls) params.set("controls", "0");
  params.set("rel", "0");
  params.set("modestbranding", "1");

  const query = params.toString();
  return `https://www.youtube-nocookie.com/embed/${videoId}${query ? `?${query}` : ""}`;
}

/** Default hero background — luxury community aerial footage */
export const HERO_YOUTUBE_URL =
  "https://www.youtube.com/watch?v=EngWg0F09uI";
