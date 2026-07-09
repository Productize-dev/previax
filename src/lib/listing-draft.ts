import type { ExtractedListingDraft } from "@/lib/ai/listing-extract";
import {
  newCommunityDashboardForm,
  newHomeModelForm,
  type CommunityDashboardForm,
  type HomeModelForm,
} from "@/lib/dashboard-defaults";
import { DEFAULT_PRESENTATION_YOUTUBE_URL } from "@/lib/csv-catalog-import";
import { getYouTubeThumbnailUrl, isValidYouTubeUrl } from "@/lib/youtube";
import type { HomeTag } from "@/lib/types";

export function draftToCommunityForm(
  draft: ExtractedListingDraft,
  defaultBuilderId = "",
): CommunityDashboardForm {
  const c = draft.community ?? {};
  const youtubeUrl =
    c.youtubeUrl && isValidYouTubeUrl(c.youtubeUrl)
      ? c.youtubeUrl
      : DEFAULT_PRESENTATION_YOUTUBE_URL;
  const thumb = getYouTubeThumbnailUrl(youtubeUrl) ?? "";

  return {
    ...newCommunityDashboardForm(defaultBuilderId),
    name: c.name ?? "",
    city: c.city ?? "",
    description: c.description ?? "",
    mainHighlight: c.mainHighlight ?? "",
    amenities: c.amenities ?? [],
    lenders: c.lenders ?? [],
    tags: c.tags ?? newCommunityDashboardForm().tags,
    youtubeUrl,
    thumbnailUrl: thumb,
  };
}

export function draftToHomeForm(
  draft: ExtractedListingDraft,
  index = 0,
): HomeModelForm | null {
  const home = draft.homes?.[index];
  if (!home) return null;

  const youtubeUrl = home.youtubeUrl ?? "";
  const thumb =
    youtubeUrl && isValidYouTubeUrl(youtubeUrl)
      ? getYouTubeThumbnailUrl(youtubeUrl)
      : null;

  return {
    ...newHomeModelForm(),
    modelName: home.modelName ?? "",
    description: home.description ?? "",
    youtubeUrl,
    price: home.price ?? 0,
    bedrooms: home.bedrooms ?? 0,
    bathrooms: home.bathrooms ?? 0,
    sqft: home.sqft ?? 0,
    tags: (home.tags ?? ["move-in-ready"]) as HomeTag[],
    highlights: home.highlights ?? [],
    imageUrls: thumb ? [thumb] : [],
  };
}
