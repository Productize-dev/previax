import { supabaseRepository } from "./supabase-repository";
import type { SiteRepository } from "./repository";

export const repository: SiteRepository = supabaseRepository;

export type { SiteRepository } from "./repository";
