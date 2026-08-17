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

/** Public watch URL — opens native YouTube controls (quality, captions, share). */
export function getWatchUrl(videoIdOrUrl: string): string | null {
  const id =
    videoIdOrUrl.length === 11 && !videoIdOrUrl.includes("/")
      ? videoIdOrUrl
      : extractYouTubeId(videoIdOrUrl);
  return id ? `https://www.youtube.com/watch?v=${id}` : null;
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

export type YouTubeEmbedPreset = "background" | "preview" | "interactive";

type EmbedOptions = {
  preset?: YouTubeEmbedPreset;
  autoplay?: boolean;
  mute?: boolean;
  loop?: boolean;
  /** Override preset defaults. */
  controls?: boolean;
  /** Prefer captions when available (interactive preset). */
  captions?: boolean;
  /** Player origin for embed API / security. */
  origin?: string;
};

export function getEmbedUrl(
  videoId: string,
  opts: EmbedOptions = {},
): string {
  const preset = opts.preset ?? "interactive";
  const params = new URLSearchParams();

  const autoplay =
    opts.autoplay ?? (preset === "background" || preset === "preview");
  const mute =
    opts.mute ?? (preset === "background" || preset === "preview");
  const loop = opts.loop ?? preset !== "interactive";
  const controls =
    opts.controls ?? preset === "interactive";

  if (autoplay) params.set("autoplay", "1");
  if (mute) params.set("mute", "1");
  if (loop) {
    params.set("loop", "1");
    params.set("playlist", videoId);
  }
  params.set("controls", controls ? "1" : "0");
  params.set("rel", "0");
  params.set("modestbranding", "1");
  params.set("playsinline", "1");
  params.set("fs", "1");
  params.set("iv_load_policy", "3");

  if (preset === "interactive") {
    params.set("enablejsapi", "1");
    params.set("disablekb", "0");
    params.set("color", "white");
    if (opts.captions !== false) {
      params.set("cc_load_policy", "1");
    }
  }

  // postMessage mute/unmute for cinematic background heroes
  if (preset === "background") {
    params.set("enablejsapi", "1");
  }

  if (opts.origin) {
    params.set("origin", opts.origin);
  }

  const query = params.toString();
  return `https://www.youtube-nocookie.com/embed/${videoId}${query ? `?${query}` : ""}`;
}

export const YOUTUBE_IFRAME_ALLOW =
  "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; web-share";

export const YOUTUBE_PREVIEW_IFRAME_ALLOW = "autoplay; encrypted-media; picture-in-picture";

/** Default hero background — luxury community aerial footage */
export const HERO_YOUTUBE_URL =
  "https://www.youtube.com/watch?v=EngWg0F09uI";
