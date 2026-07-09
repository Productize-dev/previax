import { createSupabaseServerClient } from "../supabase/server";
import { mapProfileRow, PROFILE_COLUMNS, type ProfileRow } from "./profile";
import type { Profile } from "../types";

/**
 * Perfil del usuario autenticado ({ id, role, status, ... }) o null.
 * Solo para Server Components, Server Actions y Route Handlers.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", user.id)
    .maybeSingle();

  return data ? mapProfileRow(data as ProfileRow) : null;
}
