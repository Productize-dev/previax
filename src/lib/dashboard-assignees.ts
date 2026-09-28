import { mapProfileRow, PROFILE_COLUMNS, type ProfileRow } from "@/lib/auth/profile";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Profile, UserRole } from "@/lib/types";

/** Active profiles for a role — used by admin assignment pickers. */
export async function fetchActiveProfilesByRole(
  role: Extract<UserRole, "sales" | "builder">,
): Promise<Profile[]> {
  const { data, error } = await getSupabaseBrowserClient()
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("role", role)
    .eq("status", "active")
    .order("full_name", { ascending: true });

  if (error) throw new Error(error.message);

  return ((data ?? []) as ProfileRow[]).map(mapProfileRow);
}

export function profileAssigneeLabel(profile: Profile): string {
  const name = profile.fullName?.trim();
  const email = profile.email?.trim();
  if (name && email) return `${name} (${email})`;
  return name || email || profile.id.slice(0, 8);
}

/** Sentinel for Select “unassigned” (empty string is invalid for some Select libs). */
export const ASSIGNEE_NONE = "__none__";
