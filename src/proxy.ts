import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { UserRole, UserStatus } from "@/lib/types";
import { APP_HOME } from "@/lib/routes";

// Proxy (middleware en Next <16): refresca la sesión de Supabase en cada
// request y protege /dashboard por rol. La autorización de datos real
// vive en RLS; esto es solo un check optimista para UX.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Importante: getUser() valida y refresca el token si expiró.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard")) {
    const redirectTo = (path: string) => {
      const redirect = NextResponse.redirect(new URL(path, request.url));
      response.cookies
        .getAll()
        .forEach(({ name, value }) => redirect.cookies.set(name, value));
      return redirect;
    };

    if (!user) {
      return redirectTo(`/login?next=${encodeURIComponent(pathname)}`);
    }

    const { data } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .maybeSingle();
    const profile = data as { role: UserRole; status: UserStatus } | null;

    if (!profile || profile.role === "buyer") {
      return redirectTo(APP_HOME);
    }
    if (profile.status !== "active") {
      return redirectTo("/pending-approval");
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Todo excepto estáticos, para que la sesión se refresque en cada request.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|csv)$).*)",
  ],
};
