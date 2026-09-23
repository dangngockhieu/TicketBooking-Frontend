import { NextResponse, type NextRequest } from "next/server";

/**
 * Chặn ở edge dựa trên sự tồn tại cookie refreshToken (HttpOnly) — không đọc được
 * role ở đây, RoleGuard phía client lo phần đó. Xem docs/04-auth-flow.md §4.
 */
export function proxy(req: NextRequest) {
  if (!req.cookies.has("refreshToken")) {
    const url = new URL("/login", req.url);
    const next = req.nextUrl.pathname + req.nextUrl.search;
    url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/queue/:path*",
    "/checkout/:path*",
    "/payment/:path*",
    "/me/:path*",
    "/organizer/:path*",
    "/admin/:path*",
  ],
};
