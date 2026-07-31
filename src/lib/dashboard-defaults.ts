import { CONTACT_EMAIL } from "@/lib/config";
import { NO_BUILDER_ASSIGNED_LABEL, MULTI_BUILDER_PENDING_LABEL } from "@/lib/community-builders";
import type {
  BuilderInput,
  CommunityInput,
  CommunityTag,
  HomeInput,
  HomeListingCategory,
  HomeTag,
} from "@/lib/types";

/** Default tags applied when creating a new community in the dashboard. */
export const DEFAULT_NEW_COMMUNITY_TAGS: CommunityTag[] = [
  "new-construction",
  "master-planned",
];

/** Default tags applied when creating a new home model in the dashboard. */
export const DEFAULT_NEW_HOME_TAGS: HomeTag[] = ["move-in-ready"];

/** Default listing badges for new home models (homepage organization). */
export const DEFAULT_NEW_HOME_LISTING_CATEGORIES: HomeListingCategory[] = [];

export const DEFAULT_COMMUNITY_FIELDS: Omit<
  CommunityInput,
  "name" | "city" | "description" | "thumbnailUrl" | "youtubeUrl"
> = {
  builderName: "TBD",
  builderOffers: "",
  realtorName: "Previax Team",
  realtorPhone: "",
  realtorEmail: CONTACT_EMAIL,
  realtorPhotoUrl: "/previax-mark.png",
  amenities: [],
  lenders: [],
  mainHighlight: "",
  schoolDistrict: "",
  commuteNotes: "",
  hoaRange: "",
  offerExpires: "",
  tagline: "",
  lifestyleNotes: "",
  schoolOverview: "",
  schools: [],
  diningOverview: "",
  nearbyPlaces: [],
  reviews: [],
  mediaGallery: [],
  isHidden: false,
};

export type CommunityDashboardForm = {
  communityType: "single" | "multi" | "none";
  builderId: string;
  builderIds: string[];
  name: string;
  city: string;
  description: string;
  thumbnailUrl: string;
  youtubeUrl: string;
  amenities: string[];
  lenders: string[];
  mainHighlight: string;
  tags: CommunityTag[];
};

export const emptyCommunityDashboardForm: CommunityDashboardForm = {
  communityType: "single",
  builderId: "",
  builderIds: [],
  name: "",
  city: "",
  description: "",
  thumbnailUrl: "",
  youtubeUrl: "",
  amenities: [],
  lenders: [],
  mainHighlight: "",
  tags: [],
};

export function newCommunityDashboardForm(
  builderId = "",
): CommunityDashboardForm {
  return {
    ...emptyCommunityDashboardForm,
    builderId,
    builderIds: builderId ? [builderId] : [],
    tags: [...DEFAULT_NEW_COMMUNITY_TAGS],
  };
}

function inferCommunityType(
  community: CommunityInput,
): CommunityDashboardForm["communityType"] {
  if (community.isMultiBuilder) return "multi";

  const builderIds =
    community.builderIds?.length
      ? community.builderIds
      : community.builderId
        ? [community.builderId]
        : [];

  if (
    builderIds.length === 0 ||
    community.builderName === NO_BUILDER_ASSIGNED_LABEL
  ) {
    return "none";
  }

  return "single";
}

export function communityToDashboardForm(
  community: CommunityInput,
): CommunityDashboardForm {
  const builderIds =
    community.builderIds?.length
      ? community.builderIds
      : community.builderId
        ? [community.builderId]
        : [];

  return {
    communityType: inferCommunityType(community),
    builderId: community.builderId ?? builderIds[0] ?? "",
    builderIds,
    name: community.name,
    city: community.city,
    description: community.description,
    thumbnailUrl: community.thumbnailUrl,
    youtubeUrl: community.youtubeUrl,
    amenities: community.amenities ?? [],
    lenders: community.lenders ?? [],
    mainHighlight: community.mainHighlight ?? "",
    tags: community.tags ?? [],
  };
}

export function toCommunityInput(
  form: CommunityDashboardForm,
  existing?: CommunityInput,
  builders: { id: string; name: string }[] = [],
): CommunityInput {
  const { communityType: _communityType, builderIds: _formBuilderIds, ...rest } =
    form;

  if (form.communityType === "none") {
    return {
      ...DEFAULT_COMMUNITY_FIELDS,
      ...existing,
      ...rest,
      isMultiBuilder: false,
      builderIds: [],
      builderId: undefined,
      builderName: NO_BUILDER_ASSIGNED_LABEL,
    };
  }

  const selectedIds =
    form.communityType === "multi"
      ? form.builderIds
      : form.builderId
        ? [form.builderId]
        : [];

  const selectedBuilders = selectedIds
    .map((id) => builders.find((builder) => builder.id === id))
    .filter((builder): builder is { id: string; name: string } =>
      Boolean(builder),
    );

  const primaryBuilder = selectedBuilders[0];
  const builderName =
    form.communityType === "multi"
      ? selectedBuilders.length > 1
        ? selectedBuilders.map((builder) => builder.name).join(", ")
        : selectedBuilders.length === 1
          ? selectedBuilders[0].name
          : MULTI_BUILDER_PENDING_LABEL
      : (primaryBuilder?.name ??
        existing?.builderName ??
        DEFAULT_COMMUNITY_FIELDS.builderName);

  return {
    ...DEFAULT_COMMUNITY_FIELDS,
    ...existing,
    ...rest,
    isMultiBuilder: form.communityType === "multi",
    builderIds: selectedIds,
    builderId: primaryBuilder?.id,
    builderName,
  };
}

export type BuilderDashboardForm = {
  name: string;
  description: string;
  logoUrl: string;
};

export const emptyBuilderDashboardForm: BuilderDashboardForm = {
  name: "",
  description: "",
  logoUrl: "",
};

export function builderToDashboardForm(builder: {
  name: string;
  description?: string;
  logoUrl?: string;
}): BuilderDashboardForm {
  return {
    name: builder.name,
    description: builder.description ?? "",
    logoUrl: builder.logoUrl ?? "",
  };
}

export function toBuilderInput(form: BuilderDashboardForm): BuilderInput {
  return {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    logoUrl: form.logoUrl.trim() || undefined,
  };
}

export type HomeModelForm = {
  modelName: string;
  description: string;
  youtubeUrl: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  tags: HomeTag[];
  highlights: string[];
  imageUrls: string[];
};

export const emptyHomeModelForm: HomeModelForm = {
  modelName: "",
  description: "",
  youtubeUrl: "",
  price: 0,
  bedrooms: 0,
  bathrooms: 0,
  sqft: 0,
  tags: [...DEFAULT_NEW_HOME_TAGS],
  highlights: [],
  imageUrls: [],
};

export function newHomeModelForm(): HomeModelForm {
  return { ...emptyHomeModelForm };
}

export function homeToModelForm(home: {
  modelName?: string;
  description: string;
  youtubeUrl?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  tags?: HomeTag[];
  highlights?: string[];
  imageUrls?: string[];
}): HomeModelForm {
  return {
    modelName: home.modelName || "",
    description: home.description || "",
    youtubeUrl: home.youtubeUrl ?? "",
    price: home.price ?? 0,
    bedrooms: home.bedrooms ?? 0,
    bathrooms: home.bathrooms ?? 0,
    sqft: home.sqft ?? 0,
    tags: home.tags ?? [...DEFAULT_NEW_HOME_TAGS],
    highlights: home.highlights ?? [],
    imageUrls: home.imageUrls ?? [],
  };
}

export function toHomeInput(
  form: HomeModelForm,
  options: {
    seriesId: string;
    imageUrls: string[];
    existing?: HomeInput;
  },
): HomeInput {
  const { seriesId, imageUrls, existing } = options;

  return {
    seriesId,
    price: form.price || existing?.price || 0,
    bedrooms: form.bedrooms || existing?.bedrooms || 0,
    bathrooms: form.bathrooms || existing?.bathrooms || 0,
    sqft: form.sqft || existing?.sqft || 0,
    imageUrls,
    description: form.description.trim(),
    modelName: form.modelName.trim(),
    youtubeUrl: form.youtubeUrl.trim() || undefined,
    address: existing?.address ?? "",
    status: existing?.status ?? "available",
    tags: form.tags.length > 0 ? form.tags : existing?.tags ?? [...DEFAULT_NEW_HOME_TAGS],
    listingCategories: existing?.listingCategories ?? [
      ...DEFAULT_NEW_HOME_LISTING_CATEGORIES,
    ],
    tagline: existing?.tagline ?? "",
    featuresOverview: existing?.featuresOverview ?? "",
    highlights: form.highlights.length > 0 ? form.highlights : existing?.highlights ?? [],
    rooms: existing?.rooms ?? [],
    mediaGallery: existing?.mediaGallery ?? [],
    reviews: existing?.reviews ?? [],
  };
}
