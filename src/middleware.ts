import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const pathname = req.nextUrl.pathname;

  // Check if the user is trying to access an admin route
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    // If no token, redirect to login page
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", req.url); // Optional: redirect back after login
      return NextResponse.redirect(loginUrl);
    }

    // If token exists but role is not admin, deny access
    if (token.role !== "admin") {
      console.log(
        "Unauthorized access attempt to (logged in, not admin):",
        pathname,
        "by user:",
        token.email
      );
      // For API routes, return 403 Forbidden
      if (pathname.startsWith("/api/admin")) {
        return new NextResponse("Forbidden: Requires admin role", {
          status: 403,
        });
      }
      // For pages, redirect to home page
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Allow the request to proceed for non-admin routes or authorized admins
  return NextResponse.next();
}

// Apply middleware to specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * We apply the middleware broadly and check roles inside.
     * Note: The login page ('/login') is NOT excluded here.
     * If an unauthenticated user hits an admin route, they will be
     * redirected to '/login'.
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*) ",
  ],
};
