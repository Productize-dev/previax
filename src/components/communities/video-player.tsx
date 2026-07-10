import { YouTubeEmbed } from "@/components/video/youtube-embed";
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
  return (
    <YouTubeEmbed
      youtubeUrl={youtubeUrl}
      title={title}
      preset="interactive"
      className={cn(!fullBleed && "rounded-xl")}
    />
  );
}
