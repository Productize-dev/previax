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
  "two-story": "Two Story",
  basement: "Basement",
  townhome: "Townhome",
  cottage: "Cottage",
  ranch: "Ranch",
  villa: "Villa",
  "master-on-main": "Master on Main",
  loft: "Loft",
  "bonus-room": "Bonus Room",
  "three-car-garage": "3-Car Garage",
  "energy-efficient": "Energy Efficient",
  "smart-home": "Smart Home",
  "golf-course-lot": "Golf Course Lot",
  waterfront: "Waterfront",
};

export const ALL_HOME_TAGS = Object.keys(HOME_TAG_LABELS) as HomeTag[];

export function getHomeTagLabel(tag: string): string {
  return HOME_TAG_LABELS[tag as HomeTag] ?? tag;
}
