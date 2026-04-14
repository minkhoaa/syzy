import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow waitlist and its sub-paths, plus static assets and API routes
  if (
    pathname.startsWith("/waitlist") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/logo") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/fonts") ||
    pathname.startsWith("/zk") ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/waitlist", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
