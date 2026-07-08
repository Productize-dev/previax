import { extractYouTubeId, getEmbedUrl } from "@/lib/youtube";
import type { Community } from "@/lib/types";

type CommunityHeroProps = {
  community: Community;
};

export function CommunityHero({ community }: CommunityHeroProps) {
  const videoId = extractYouTubeId(community.youtubeUrl);
  const embedUrl = videoId ? getEmbedUrl(videoId) : null;

  return (
    <div className="relative mt-4 min-h-[55vh] overflow-hidden md:min-h-[72vh]">
      {embedUrl ? (
        <iframe
          src={embedUrl}
          title={community.name}
          loading="eager"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full scale-105 object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-muted" />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/30 to-black/40" />
      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-6 pb-10 pt-32 md:pb-14">
        <p className="text-sm uppercase tracking-[0.25em] text-primary">
          {community.city}, North Carolina
        </p>
        <h1 className="font-heading mt-3 text-4xl md:text-5xl lg:text-6xl">
          {community.name}
        </h1>
        {community.tagline && (
          <p className="mt-4 max-w-2xl text-lg text-foreground/90 md:text-xl">
            {community.tagline}
          </p>
        )}
      </div>
    </div>
  );
}
