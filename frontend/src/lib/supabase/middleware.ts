import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/db/types";

/**
 * Runs on every matched request (see src/middleware.ts). It:
 *  1. Refreshes the Supabase session and rotates auth cookies.
 *  2. Guards routes: unauthenticated users hitting an app route are sent to
 *     /login; authenticated users hitting an auth route are sent to /dashboard.
 *
 * IMPORTANT: cookie writes must be mirrored onto BOTH the request (so the
 * downstream response reads the fresh session) and the response (so the
 * browser receives them). This is the pattern @supabase/ssr expects.
 */

// Routes that do NOT require a session.
const PUBLIC_PREFIXES = ["/login", "/signup", "/callback", "/auth"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export async function updateSession(
  request: NextRequest,
): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[],
        ) {
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

  // Refresh the session. Do NOT run any logic between createServerClient and
  // getUser() — this call is what rotates the tokens.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Not signed in and trying to reach a protected route -> go to /login.
  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(url);
  }

  // Signed in and on an auth-only page -> go to the dashboard.
  if (
    user &&
    (pathname === "/login" ||
      pathname === "/signup" ||
      pathname === "/")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
