import type { Profile, UserRole, UserStatus } from "../types";

export const PROFILE_COLUMNS =
  "id, role, status, full_name, company_name, email, avatar_url";

export type ProfileRow = {
  id: string;
  role: UserRole;
  status: UserStatus;
  full_name: string | null;
  company_name: string | null;
  email: string | null;
  avatar_url: string | null;
};

export function mapProfileRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    role: row.role,
    status: row.status,
    fullName: row.full_name ?? undefined,
    companyName: row.company_name ?? undefined,
    email: row.email ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
  };
}

/** Roles with dashboard access. */
export function canAccessDashboard(profile: Profile | null): boolean {
  return (
    !!profile &&
    profile.status === "active" &&
    (profile.role === "builder" ||
      profile.role === "lender" ||
      profile.role === "admin" ||
      profile.role === "sales")
  );
}

/** Ruta tras login/signup según rol y estado de aprobación. */
export function getPostAuthPath(
  profile: Profile | null,
  next?: string | null,
): string {
  if (next) return next;
  if (!profile || profile.role === "buyer") return "/";
  if (profile.status !== "active") return "/pending-approval";
  return "/dashboard";
}
