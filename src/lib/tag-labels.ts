import type { HomeTag } from "./types";
import {
  BASE_COMMUNITY_TAG_LABELS,
  getAllCommunityTagOptions,
  getCommunityTagLabel,
  mergeCommunityTagLabels,
} from "./community-tag-registry";

export const COMMUNITY_TAG_LABELS = BASE_COMMUNITY_TAG_LABELS;

export { getAllCommunityTagOptions, getCommunityTagLabel, mergeCommunityTagLabels };

export const HOME_TAG_LABELS: Record<HomeTag, string> = {
  "move-in-ready": "Move-In Ready",
  "under-construction": "Under Construction",
  "custom-build": "Custom Build",
  "patio-home": "Patio Home",
  "single-story": "Single Story",
  basement: "Basement",
};

export const ALL_HOME_TAGS = Object.keys(HOME_TAG_LABELS) as HomeTag[];
