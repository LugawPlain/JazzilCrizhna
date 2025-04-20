import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  // `withAuth` enhances your `Request` object with the user's token.
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Redirect non-admins trying to access admin routes
    if (
      (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) &&
      token?.role !== "admin"
    ) {
      console.log(
        "Unauthorized access attempt to:",
        pathname,
        "by user:",
        token?.email
      );
      // You could redirect them to an unauthorized page or the home page
      // For API routes, returning a 403 Forbidden response might be more appropriate
      if (pathname.startsWith("/api/admin")) {
        return new NextResponse("Unauthorized", { status: 403 });
      }
      // For pages, redirect to home or a specific unauthorized page
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Allow the request to proceed if authorized
    return NextResponse.next();
  },
  {
    callbacks: {
      // This ensures that the middleware function itself is only run
      // if the user is authenticated. Unauthenticated users trying to
      // access protected routes defined in the matcher will be redirected
      // to the login page automatically by `withAuth`.
      authorized: ({ token }) => !!token,
    },
  }
);

// Apply middleware to specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login page itself
     * We apply the middleware broadly and then specifically check
     * for admin routes inside the middleware function.
     * You could also be more specific here and only match '/admin/:path*'
     * and '/api/admin/:path*', but this approach allows flexibility
     * if you add more role-based routes later.
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)",
  ],
};
