import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase/adminApp";

// Removed admin, App, getFirestore imports and the initialization block

export async function GET(request: NextRequest) {
  // --- Check if dbAdmin is available ---
  if (!dbAdmin) {
    console.error(
      "[API/pinned-images] Firestore instance (dbAdmin) is not available. Check lib/firebase/adminApp logs."
    );
    return NextResponse.json(
      { error: "Server configuration error (Database not ready)." },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  if (!category) {
    return NextResponse.json(
      { error: "Category parameter is required" },
      { status: 400 }
    );
  }

  // Construct dynamic collection name
  const collectionName = `${category.toLowerCase()}_uploads`;
  const dynamicCollection = dbAdmin.collection(collectionName);

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
}
