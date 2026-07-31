/** Public marketing landing (guests). */
export const MARKETING_HOME = "/";

/** Cinematic catalog / platform browse experience. */
export const APP_HOME = "/browse";

/** Builder partnership intake (questionnaire + schedule meeting). */
export const PARTNER_PATH = "/partner";

export function appHash(id: string): string {
  return `${APP_HOME}#${id}`;
}
