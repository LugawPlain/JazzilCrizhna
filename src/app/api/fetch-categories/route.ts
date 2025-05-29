import { NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase/adminApp"; // Adjust path if needed

interface CategoryLink {
  title: string;
  link: string;
}

// Cache object to store categories and timestamp
let categoryCache: {
  data: CategoryLink[];
  timestamp: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function GET() {
  const endpoint = "/api/fetch-categories";
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
  if (categoryCache && now - categoryCache.timestamp < CACHE_DURATION) {
    console.log(`${logPrefix} Returning categories from cache.`);
    return NextResponse.json(
      { categories: categoryCache.data },
      { status: 200 }
    );
  }

  console.log(
    `${logPrefix} Cache expired or not found. Fetching from Firestore.`
  );

  try {
    const collectionName = "portfolio_uploads";

    const snapshot = await dbAdmin.collection(collectionName).get();

    if (snapshot.empty) {
      console.log(`${logPrefix} No documents found in '${collectionName}'.`);
      // Even if empty, cache the result briefly to avoid hitting Firestore repeatedly if empty
      categoryCache = { data: [], timestamp: now };
      console.log(
        `${logPrefix} Fetched categories (empty) and stored in cache.`
      );
      return NextResponse.json({ categories: [] }, { status: 200 });
    }

    console.log(
      `${logPrefix} Found ${snapshot.size} document(s) in '${collectionName}'.`
    );

    // Use a Set to store unique category titles efficiently
    const categoryTitles = new Set<string>();
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.category && typeof data.category === "string") {
        categoryTitles.add(data.category);
      } else {
        console.warn(
          `${logPrefix} Document ID ${doc.id} missing or has invalid category field.`
        );
      }
    });

    // Helper function to capitalize first letter
    const capitalizeFirstLetter = (str: string): string => {
      if (!str) return str;
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    // Convert the Set of titles into the desired array structure
    const uniqueCategories: CategoryLink[] = Array.from(categoryTitles).map(
      (title) => ({
        title: capitalizeFirstLetter(title), // Apply capitalization
        link: `/portfolio/${title.toLowerCase().replace(/\s+/g, "-")}`, // Generate link from original title
      })
    );

    // Optional: Sort categories alphabetically by title
    uniqueCategories.sort((a, b) => a.title.localeCompare(b.title));

    // Store in cache
    categoryCache = {
      data: uniqueCategories,
      timestamp: now, // Use 'now' captured before the async operation
    };
    console.log(`${logPrefix} Fetched categories and stored in cache.`);

    return NextResponse.json({ categories: uniqueCategories }, { status: 200 });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    console.error(`${logPrefix} Error fetching categories:`, error);
    return NextResponse.json(
      { error: "Failed to fetch categories", details: errorMessage },
      { status: 500 }
    );
  }
}

// Optional: Add OPTIONS handler if needed for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*", // Adjust as needed
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
