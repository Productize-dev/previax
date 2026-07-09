import { supabaseRepository } from "./supabase-repository";
import type { SiteRepository } from "./repository";

// Backend activo: Supabase. El repositorio de localStorage sigue
// disponible en ./local-storage-repository como fallback manual.
export const repository: SiteRepository = supabaseRepository;

export type { SiteRepository } from "./repository";
