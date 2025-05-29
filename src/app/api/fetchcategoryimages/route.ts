import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";
import { Firestore } from "firebase-admin/firestore";

// Define an interface for the image data
interface ImageData {
  id: string;
  r2FileKey?: string;
  originalFilename?: string;
  contentType?: string;
  photographer?: string | null;
  photographerLink?: string | null;
  eventDate?: string | null;
  location?: string | null;
  event?: string | null;
  category?: string;
  uploadedAt?: string | null;
  advertisingLink?: string | null;
  [key: string]: unknown; // Changed any to unknown
}

// Assume Firebase Admin SDK is already initialized similarly to uploadimages route
// Ensure 'db' is accessible here (might need slight refactoring or shared init logic)
let db: Firestore;
if (admin.apps.length) {
  db = admin.firestore();
} else {
  // Attempt re-initialization or handle error (ideally init logic is shared/robust)
  try {
    const serviceAccountEnvVar = process.env.FIREBASE_SA_BASE64_CONTENT;
    if (!serviceAccountEnvVar) {
      throw new Error(
        "FIREBASE_SA_BASE64_CONTENT environment variable not set."
      );
    }

    let parsedServiceAccount;
    try {
      // Try to parse as Base64 encoded JSON
      const decodedJson = Buffer.from(serviceAccountEnvVar, "base64").toString(
        "utf-8"
      );
      parsedServiceAccount = JSON.parse(decodedJson);
    } catch (parseError: unknown) {
      // Log the parsing error message, which should be safe
      const parseErrorMessage =
        parseError instanceof Error ? parseError.message : String(parseError);
      console.error(
        "[/api/fetchcategoryimages] FAILED to parse FIREBASE_SA_BASE64_CONTENT as Base64 encoded JSON. Ensure the environment variable contains a valid Base64 encoded service account key. Parsing error:",
        parseErrorMessage
      );
      // Let this error propagate to the outer catch.
      throw new Error(
        "Invalid service account configuration: FIREBASE_SA_BASE_64_CONTENT is not valid Base64 encoded JSON."
      );
    }

    // If we reach here, parsedServiceAccount should be a valid object
    admin.initializeApp({
      credential: admin.credential.cert(parsedServiceAccount),
    });
    db = admin.firestore();
    console.log(
      "[/api/fetchcategoryimages] Firebase Admin Init successful with parsed service account."
    );
  } catch (error: unknown) {
    // Type guard for error message
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      "[/api/fetchcategoryimages] CRITICAL: Firebase Admin initialization failed:",
      errorMessage // This will be from our specific throw or a general initApp failure.
    );
    // db remains uninitialized
  }
}

// Function to extract the start date from a date range or single date
// Format: "MM/DD/YYYY - MM/DD/YYYY" or "MM/DD/YYYY"
function extractStartDate(dateStr: string | null): Date | null {
  if (!dateStr) return null;

  // Check if it's a range (has a hyphen with spaces)
  if (dateStr.includes(" - ")) {
    // Extract start date from range
    const startDateStr = dateStr.split(" - ")[0].trim();
    return parseDate(startDateStr);
  }

  // It's a single date
  return parseDate(dateStr);
}

// Helper to parse a date string in MM/DD/YYYY format
function parseDate(dateStr: string): Date | null {
  try {
    // Handle ISO format
    if (dateStr.includes("T")) {
      return new Date(dateStr);
    }

    // Handle MM/DD/YYYY format
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const month = parseInt(parts[0]) - 1; // JS months are 0-indexed
      const day = parseInt(parts[1]);
      const year = parseInt(parts[2]);

      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    // Try direct parsing as fallback
    const date = new Date(dateStr);
    return !isNaN(date.getTime()) ? date : null;
  } catch (e) {
    console.error(`[/api/getimages] Error parsing date: ${dateStr}`, e);
    return null;
  }
}

export async function GET(request: NextRequest) {
  if (!db) {
    console.error("[/api/getimages] Firebase DB not initialized.");
    return NextResponse.json(
      { error: "Server configuration error (Firebase not ready)." },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const shouldRevalidate = searchParams.get("revalidate") === "1";
  const timestamp = searchParams.get("t") || Date.now().toString();

  if (!category) {
    return NextResponse.json(
      { error: "Category parameter is required." },
      { status: 400 }
    );
  }

  if (shouldRevalidate) {
    console.log(
      `[/api/getimages] Revalidation requested for category: ${category} at ${new Date(
        parseInt(timestamp)
      ).toISOString()}`
    );
  }

  // Sanitize category to create collection name (same logic as upload)
  const collectionName = `${category
    .toLowerCase()
    .replace(/\s+/g, "_")}_uploads`;
  console.log(
    `[/api/getimages] Fetching data for category: ${category} from collection: ${collectionName}`
  );

  try {
    // Fetch all documents first, sorted by upload date
    const querySnapshot = await db
      .collection(collectionName)
      .orderBy("uploadedAt", "desc")
      .get();

    console.log(
      `[/api/getimages] Successfully retrieved ${querySnapshot.docs.length} documents from Firestore`
    );

    const imagesData = querySnapshot.docs.map((doc, index) => {
      const data = doc.data();

      // Handle eventDate differently based on type
      let eventDateValue = null;

      if (data.eventDate) {
        if (typeof data.eventDate === "string") {
          // Already a string (likely a date range), keep as is
          eventDateValue = data.eventDate;
        } else if (data.eventDate?.toDate) {
          // Convert Firestore Timestamp to ISO string
          eventDateValue = data.eventDate.toDate().toISOString();
        } else {
          // Unknown format, just use as is
          eventDateValue = data.eventDate;
        }
      }

      // Handle uploadedAt
      const uploadedAtISO = data.uploadedAt?.toDate
        ? data.uploadedAt.toDate().toISOString()
        : null;

      const imageData: ImageData = {
        id: doc.id,
        ...data,
        // Override with properly handled values
        eventDate: eventDateValue,
        uploadedAt: uploadedAtISO,
        advertisingLink: data.advertisingLink || null,
      };

      // Log every 5th image in detail, plus the first and last one
      if (
        index === 0 ||
        index === querySnapshot.docs.length - 1 ||
        index % 5 === 0
      ) {
        console.log(
          `[/api/getimages] Image ${index + 1}/${querySnapshot.docs.length}:`,
          {
            id: imageData.id,
            r2FileKey: imageData.r2FileKey,
            eventDate: imageData.eventDate,
            photographer: imageData.photographer,
            photographerLink: imageData.photographerLink,
            contentType: imageData.contentType,
            uploadedAt: imageData.uploadedAt,
            advertisingLink: imageData.advertisingLink,
          }
        );
      }

      return imageData;
    });

    // Sort the images by start date (newest first)
    // This allows us to sort by the first date in any date ranges
    const sortedImagesData = [...imagesData].sort((a, b) => {
      const dateA = extractStartDate(a.eventDate || null);
      const dateB = extractStartDate(b.eventDate || null);

      // Handle null cases
      if (!dateA && !dateB) return 0; // Both null, no change
      if (!dateA) return 1; // A is null, B comes first
      if (!dateB) return -1; // B is null, A comes first

      // Descending order (newest first)
      return dateB.getTime() - dateA.getTime();
    });

    // Log how sorting affected the order
    console.log(
      `[/api/getimages] Images sorted by start date (for date ranges). Original order changed: ${
        JSON.stringify(imagesData.slice(0, 3).map((img) => img.id)) !==
        JSON.stringify(sortedImagesData.slice(0, 3).map((img) => img.id))
      }`
    );

    // Log statistics about fetched images
    const imageStats = {
      total: sortedImagesData.length,
      withEventDate: sortedImagesData.filter((img) => img.eventDate).length,
      withDateRange: sortedImagesData.filter((img) =>
        img.eventDate?.includes(" - ")
      ).length,
      withPhotographer: sortedImagesData.filter((img) => img.photographer)
        .length,
      withPhotographerLink: sortedImagesData.filter(
        (img) => img.photographerLink
      ).length,
      byContentType: sortedImagesData.reduce((acc, img) => {
        const type = img.contentType || "unknown";
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    console.log(
      `[/api/getimages] Image statistics for ${category}:`,
      imageStats
    );
    console.log(
      `[/api/getimages] Found ${sortedImagesData.length} documents for ${category}.`
    );
    return NextResponse.json(
      {
        images: sortedImagesData,
        revalidated: shouldRevalidate,
        timestamp: timestamp,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error: unknown) {
    // Type guard for error message
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `[/api/getimages] Error fetching images for ${category}:`,
      error // Log original error object
    );
    return NextResponse.json(
      { error: "Failed to fetch images.", details: errorMessage }, // Use safe message
      { status: 500 }
    );
  }
}
