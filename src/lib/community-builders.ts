import type { Builder, Community } from "./types";

export const NO_BUILDER_ASSIGNED_LABEL = "No builder assigned";
export const MULTI_BUILDER_PENDING_LABEL = "Multi-builder community";

/** Builders visible on the public marketing landing (logo strip + Meet the Builders). */
export function isBuilderShownOnMarketing(builder: Builder): boolean {
  return builder.showOnMarketing !== false;
}

export function getMarketingBuilders(builders: Builder[]): Builder[] {
  return builders
    .filter(isBuilderShownOnMarketing)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getCommunityBuilderIds(community: Community): string[] {
  if (community.builderIds?.length) return community.builderIds;
  return community.builderId ? [community.builderId] : [];
}

export function communityHasAssignedBuilder(community: Community): boolean {
  return getCommunityBuilderIds(community).length > 0;
}

export function communityHasBuilder(
  community: Community,
  builderId: string,
): boolean {
  return getCommunityBuilderIds(community).includes(builderId);
}

export function getCommunityBuilderNames(
  community: Community,
  builders: Builder[] = [],
): string[] {
  if (!communityHasAssignedBuilder(community)) return [];

  const ids = getCommunityBuilderIds(community);

  if (builders.length && ids.length) {
    const names = ids
      .map((id) => builders.find((builder) => builder.id === id)?.name)
      .filter((name): name is string => Boolean(name));
    if (names.length) return names;
  }

  if (
    community.builderName &&
    community.builderName !== NO_BUILDER_ASSIGNED_LABEL &&
    community.builderName !== MULTI_BUILDER_PENDING_LABEL
  ) {
    if (community.isMultiBuilder && community.builderName.includes(",")) {
      return community.builderName
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean);
    }
    return [community.builderName];
  }

  return [];
}

export function getCommunityBuilderDisplay(
  community: Community,
  builders: Builder[] = [],
): string {
  const names = getCommunityBuilderNames(community, builders);
  if (names.length > 0) return names.join(", ");
  if (community.isMultiBuilder) return MULTI_BUILDER_PENDING_LABEL;
  return NO_BUILDER_ASSIGNED_LABEL;
}

export function syncCommunityBuilderFields(
  community: Community,
  builders: Builder[],
): Community {
  const ids = getCommunityBuilderIds(community);

  if (!ids.length) {
    if (community.isMultiBuilder) {
      return {
        ...community,
        builderIds: [],
        builderId: undefined,
        builderName: MULTI_BUILDER_PENDING_LABEL,
        isMultiBuilder: true,
      };
    }

    return {
      ...community,
      builderIds: [],
      builderId: undefined,
      builderName: NO_BUILDER_ASSIGNED_LABEL,
      isMultiBuilder: false,
    };
  }

  const names = ids
    .map((id) => builders.find((builder) => builder.id === id)?.name)
    .filter((name): name is string => Boolean(name));

  return {
    ...community,
    builderIds: ids,
    builderId: ids[0],
    builderName:
      community.isMultiBuilder && names.length > 1
        ? names.join(", ")
        : (names[0] ?? community.builderName),
  };
}
