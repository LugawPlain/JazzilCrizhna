import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";
import { App, getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// --- Firebase Admin Initialization ---
// Ensure you have your service account key JSON file
// and the GOOGLE_APPLICATION_CREDENTIALS env variable set
// OR initialize manually:
/*
const serviceAccount = require('/path/to/your/serviceAccountKey.json'); // Adjust path

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount)
  });
} else {
  admin.app(); // If already initialized, use that app
}
*/

// Safer initialization checking if apps exist
let app: App;
if (getApps().length === 0) {
  // If using GOOGLE_APPLICATION_CREDENTIALS env var:
  app = initializeApp();
  // If using manual credentials (uncomment the import/path above):
  // app = initializeApp({ credential: cert(serviceAccount) });
} else {
  app = admin.app();
}

const db = getFirestore(app);
// const imagesCollection = db.collection("images"); // Remove hardcoded collection
// ------------------------------------

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  if (!category) {
    return NextResponse.json(
      { error: "Category parameter is required" },
      { status: 400 }
    );
  }

  // Construct dynamic collection name, ensuring lowercase
  const collectionName = `${category.toLowerCase()}_uploads`;
  console.log(
    `[API/pinned-images] Using dynamic collection (forced lowercase): '${collectionName}'`
  );
  const dynamicCollection = db.collection(collectionName);

  console.log(`[API/pinned-images] Fetching for category: ${category}`);

  try {
    // Query Firestore for images in the dynamic collection that are pinned
    console.log(
      `[API/pinned-images] Querying collection '${collectionName}' for pinned images.`
    );
    const snapshot = await dynamicCollection
      .where("isPinned", "==", true) // No need to filter by category again, collection is already category-specific
      .select("r2FileKey") // Select only the r2FileKey field
      .get();

    if (snapshot.empty) {
      console.log(
        `[API/pinned-images] No pinned images found for category: ${category}`
      );
      return NextResponse.json([]); // Return empty array if none found
    }

    // Extract the r2FileKey from each document
    const pinnedKeys = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return data.r2FileKey as string;
      })
      .filter((key) => !!key); // Filter out any potential undefined/null keys

    console.log(
      `[API/pinned-images] Found pinned keys: ${pinnedKeys.length} for category: ${category}`
    );
    return NextResponse.json(pinnedKeys);
  } catch (error) {
    console.error(
      `[API/pinned-images] Error fetching pinned images for category '${category}':`,
      error
    );
    let errorMessage = "Failed to fetch pinned images";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    // Avoid leaking sensitive error details, log them server-side
    return NextResponse.json(
      { error: "Internal server error occurred" },
      { status: 500 }
    );
  }
  // No finally block needed for Firestore client connection management typically
}
