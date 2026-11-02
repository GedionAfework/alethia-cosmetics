import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "alethia_cosmo_session";

export function proxy(request: NextRequest) {
  if (!request.cookies.get(COOKIE_NAME)?.value) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/pos", "/pos/:path*", "/account", "/account/:path*"],
};
