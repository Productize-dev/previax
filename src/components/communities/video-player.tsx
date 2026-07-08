import { extractYouTubeId, getEmbedUrl } from "@/lib/youtube";
import { cn } from "@/lib/utils";

type VideoPlayerProps = {
  youtubeUrl: string;
  title: string;
  fullBleed?: boolean;
};

export function VideoPlayer({
  youtubeUrl,
  title,
  fullBleed,
}: VideoPlayerProps) {
  const videoId = extractYouTubeId(youtubeUrl);

  if (!videoId) {
    return (
      <div
        className={cn(
          "flex aspect-video items-center justify-center bg-muted",
          !fullBleed && "rounded-xl",
        )}
      >
        <p className="text-muted-foreground">
          Video unavailable — please check the YouTube URL.
        </p>
      </div>
    );
  }

  const embedUrl = getEmbedUrl(videoId);

  return (
    <div
      className={cn(
        "aspect-video overflow-hidden",
        !fullBleed && "rounded-xl",
      )}
    >
      <iframe
        src={embedUrl}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  );
}
