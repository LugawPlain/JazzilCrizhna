// src/app/api/fetch-project-images/route.ts
import { NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase/adminApp"; // Adjust path if needed

// Define the structure to match CategoryData/ProjectCard needs
interface ProjectCardData {
  category: string;
  imageSrc: string; // Renamed from image for clarity
  title?: string; // Make optional if not always present
  link?: string; // Likely the portfolio link derived from category
  photographer?: string | null;
  photographerLink?: string | null; // Renamed for consistency
  // Add any other fields ProjectCard might display if available in Firestore
}

// Cache object to store project images data and timestamp
let projectImagesCache: {
  data: ProjectCardData[];
  timestamp: number;
} | null = null;

const CACHE_DURATION = 20 * 60 * 1000; // 20 minutes in milliseconds

// Add POST handler for cache invalidation
export async function POST(request: Request) {
  const endpoint = "/api/fetch-categories-thumbnails";
  const logPrefix = `[${endpoint}]`;

  console.log(
    `${logPrefix} POST request received (potential cache invalidation).`
  );

  // Get the secret token from headers
  const invalidateSecret = request.headers.get("X-Invalidate-Cache-Secret");
  const expectedSecret = process.env.CACHE_INVALIDATION_SECRET;

  // Check for the secret
  if (!expectedSecret) {
    console.error(
      `${logPrefix} CACHE_INVALIDATION_SECRET environment variable is not set. Invalidation is disabled.`
    );
    return NextResponse.json(
      { error: "Server not configured for cache invalidation." },
      { status: 500 }
    );
  }

  if (!invalidateSecret || invalidateSecret !== expectedSecret) {
    console.warn(
      `${logPrefix} Invalid or missing cache invalidation secret provided.`
    );
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing secret." },
      { status: 401 } // Use 401 or 403 for unauthorized/forbidden
    );
  }

  // Invalidate the cache
  projectImagesCache = null;
  console.log(`${logPrefix} Cache successfully invalidated by POST request.`);

  return NextResponse.json(
    { message: "Project images cache invalidated successfully." },
    { status: 200 }
  );
}

export async function GET() {
  const endpoint = "/api/fetch-categories-thumbnails";
  const logPrefix = `[${endpoint}]`;

  if (!dbAdmin) {
    console.error(`${logPrefix} Firestore instance (dbAdmin) not available.`);
    return NextResponse.json(
      { error: "Server configuration error (Database not ready)." },
      { status: 500 }
    );
  }

  // Check if cache is valid
  const now = Date.now();
  if (
    projectImagesCache &&
    now - projectImagesCache.timestamp < CACHE_DURATION
  ) {
    console.log(`${logPrefix} Returning project images from cache.`);
    return NextResponse.json(
      { projectImages: projectImagesCache.data },
      { status: 200 }
    );
  }

  console.log(
    `${logPrefix} Cache expired or not found. Fetching from Firestore.`
  );

  try {
    const collectionName = "portfolio_uploads";
    console.log(
      `${logPrefix} Querying '${collectionName}' for documents where isProjectImage is true.`
    );

    const projectImagesSnapshot = await dbAdmin
      .collection(collectionName)
      .where("isProjectImage", "==", true)
      .get();

    if (projectImagesSnapshot.empty) {
      console.log(
        `${logPrefix} No documents found with isProjectImage = true.`
      );
      // Even if empty, cache the result briefly to avoid hitting Firestore repeatedly if empty
      projectImagesCache = { data: [], timestamp: now };
      console.log(
        `${logPrefix} Fetched project images (empty) and stored in cache.`
      );
      return NextResponse.json({ projectImages: [] }, { status: 200 });
    }

    console.log(
      `${logPrefix} Found ${projectImagesSnapshot.size} document(s) marked as project images.`
    );

    const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_SUB_URL || "";
    if (!r2PublicUrl) {
      console.warn(
        `${logPrefix} NEXT_PUBLIC_R2_PUBLIC_SUB_URL is not set. Image URLs might be incomplete.`
      );
    }

    const projectImages: ProjectCardData[] = projectImagesSnapshot.docs.map(
      (doc) => {
        const data = doc.data();
        const category = data.category || "unknown";
        const imageSrc =
          r2PublicUrl && data.r2FileKey
            ? `${r2PublicUrl}/${data.r2FileKey}`
            : "/placeholder.jpg";

        // console.log( // Removed verbose per-document log
        //   `${logPrefix} Mapping doc ID ${doc.id}: Category='${category}', Key='${data.r2FileKey}', Src='${imageSrc}'`
        // );

        return {
          category: category,
          imageSrc: imageSrc,
          title: data.title || category, // Default title to category if not set
          link: `/portfolio/${category.toLowerCase().replace(/\s+/g, "-")}`, // Generate link from category
          photographer: data.photographer || null,
          photographerLink: data.photographerLink || null,
        };
      }
    );

    projectImages.sort((a, b) => a.category.localeCompare(b.category));
    console.log(
      `${logPrefix} Returning ${projectImages.length} sorted project image items.`
    );

    // Store in cache
    // Use 'now' captured before the async operation for consistency
    projectImagesCache = {
      data: projectImages,
      timestamp: now,
    };
    console.log(`${logPrefix} Fetched project images and stored in cache.`);

    return NextResponse.json({ projectImages }, { status: 200 });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    console.error(`${logPrefix} Error fetching project images:`, error);
    return NextResponse.json(
      { error: "Failed to fetch project images", details: errorMessage },
      { status: 500 }
    );
  }
}

// Optional: Add OPTIONS handler if needed
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*", // Adjust as needed
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS", // Allow POST now
      "Access-Control-Allow-Headers": "Content-Type, X-Invalidate-Cache-Secret", // Allow the custom header
    },
  });
}
