import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Log entry into middleware for debugging
  // console.log(`[Middleware] Checking path: ${pathname}`);

  // Get the JWT token from the request
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    console.error(
      "[Middleware] NEXTAUTH_SECRET environment variable is not set!"
    );
    // Block access if secret is missing (critical configuration error)
    return new Response("Internal Server Error: Auth configuration missing", {
      status: 500,
    });
  }

  const token = await getToken({ req, secret });

  // Check if user is authenticated AND has the admin role
  if (!token || token.role !== "admin") {
    // Log the reason for redirection
    const reason = !token
      ? "No token found"
      : `Role mismatch (role: ${token.role})`;
    console.log(
      `[Middleware] Unauthorized access to ${pathname}. Reason: ${reason}. Redirecting.`
    );

    // Redirect non-admins trying to access /admin/* routes
    // Redirect to home page or a specific login/unauthorized page
    const url = req.nextUrl.clone();
    url.pathname = "/"; // Redirect to home page
    // Or redirect to a login page: url.pathname = '/login';
    // Or redirect to an unauthorized page: url.pathname = '/unauthorized';

    // Include the original path as a query parameter if desired (e.g., for redirect after login)
    // url.searchParams.set('callbackUrl', pathname);

    return NextResponse.redirect(url);
  }

  // Log successful admin access
  // console.log(`[Middleware] Admin access granted to ${pathname}.`);

  // Allow the request to proceed if the user is an admin
  return NextResponse.next();
}

// Configure the middleware to run only on paths starting with /admin
export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
