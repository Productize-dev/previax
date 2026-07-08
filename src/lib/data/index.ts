import { localStorageRepository } from "./local-storage-repository";
import type { SiteRepository } from "./repository";

export const repository: SiteRepository = localStorageRepository;

export type { SiteRepository } from "./repository";
