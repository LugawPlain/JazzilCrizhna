export default {
  async fetch(request, env) {
    // Parse the requested URL
    const url = new URL(request.url);
    const { pathname } = url;

    // Handle image caching
    if (
      pathname.endsWith(".webp") ||
      pathname.endsWith(".jpg") ||
      pathname.endsWith(".png") ||
      pathname.endsWith(".svg")
    ) {
      // Fetch the image
      const imageResponse = await fetch(request);

      // If the image was successfully retrieved
      if (imageResponse.ok) {
        // Create a new response with aggressive caching headers
        const response = new Response(imageResponse.body, imageResponse);

        // Cache images for 7 days
        response.headers.set(
          "Cache-Control",
          "public, max-age=604800, immutable"
        );

        return response;
      }

      return imageResponse;
    }

    // Only process GET requests
    if (request.method !== "GET") return fetch(request);

    // Handle standard page requests
    // Add Cloudflare-specific optimizations for Next.js sites
    const response = await fetch(request);

    // Ensure HTML pages are not cached in browser but can be cached by CDN
    if (pathname.endsWith("/") || pathname.endsWith(".html")) {
      const newResponse = new Response(response.body, response);
      newResponse.headers.set(
        "Cache-Control",
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400"
      );
      return newResponse;
    }

    // Add caching for JavaScript and CSS files
    if (pathname.endsWith(".js") || pathname.endsWith(".css")) {
      const newResponse = new Response(response.body, response);
      newResponse.headers.set(
        "Cache-Control",
        "public, max-age=31536000, immutable"
      );
      return newResponse;
    }

    return response;
  },
};
