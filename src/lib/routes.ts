/** Public marketing landing (guests). */
export const MARKETING_HOME = "/";

/** Cinematic catalog / platform browse experience. */
export const APP_HOME = "/browse";

/** Builder partnership intake (questionnaire + schedule meeting). */
export const PARTNER_PATH = "/partner";

export function appHash(id: string): string {
  return `${APP_HOME}#${id}`;
}

/** Opens the community video overlay. `play=1` plays the first model / tour. */
export function communityPlayHref(communityId: string, homeId?: string): string {
  if (homeId) {
    return `/communities/${communityId}?play=${encodeURIComponent(homeId)}`;
  }
  return `/communities/${communityId}?play=1`;
}
