import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const accessToken = req.cookies.get("accessToken")?.value;
  const url = req.nextUrl.clone();

  const publicPaths = ["/login", "/signup"];
  const protectedPaths = [
    "/dashboard",
    "/assessments",
    "/feedback",
    "/profile",
  ];

  // ----- PUBLIC PAGES -----
  // If user is logged in, redirect away from login/signup
  if (publicPaths.some((path) => url.pathname.startsWith(path))) {
    if (accessToken) {
      url.pathname = "/dashboard"; // or any default protected page
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // ----- PROTECTED PAGES -----
  // If user tries to access protected page without token, redirect to login
  if (protectedPaths.some((path) => url.pathname.startsWith(path))) {
    if (!accessToken) {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Default: allow everything else
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/signup",
    "/dashboard",
    "/dashboard/:path*",
    "/assessments",
    "/assessments/:path*",
    "/feedback",
    "/feedback/:path*",
    "/profile",
    "/profile/:path*",
  ],
};
