import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";
import { Firestore } from "firebase-admin/firestore";

// Assume Firebase Admin SDK is already initialized similarly to uploadimages route
// Ensure 'db' is accessible here (might need slight refactoring or shared init logic)
let db: Firestore;
if (admin.apps.length) {
  db = admin.firestore();
} else {
  // Attempt re-initialization or handle error (ideally init logic is shared/robust)
  try {
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!serviceAccountPath)
      throw new Error("GOOGLE_APPLICATION_CREDENTIALS not set.");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
    });
    db = admin.firestore();
    console.log("[/api/getimages] Secondary Firebase Admin Init successful.");
  } catch (error: any) {
    console.error(
      "[/api/getimages] CRITICAL: Firebase Admin initialization failed:",
      error.message
    );
    // db remains uninitialized
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

  if (!category) {
    return NextResponse.json(
      { error: "Category parameter is required." },
      { status: 400 }
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
    const querySnapshot = await db
      .collection(collectionName)
      .orderBy("uploadedAt", "desc") // Optional: order by upload date
      // .limit(25) // Optional: add limit for pagination
      .get();

    const imagesData = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      // Convert Firestore Timestamp to ISO string for JSON serialization
      const eventDateISO = data.eventDate?.toDate
        ? data.eventDate.toDate().toISOString()
        : null;
      const uploadedAtISO = data.uploadedAt?.toDate
        ? data.uploadedAt.toDate().toISOString()
        : null;

      return {
        id: doc.id,
        ...data,
        // Overwrite Timestamps with ISO strings
        eventDate: eventDateISO,
        uploadedAt: uploadedAtISO,
      };
    });

    console.log(
      `[/api/getimages] Found ${imagesData.length} documents for ${category}.`
    );
    return NextResponse.json(imagesData, { status: 200 });
  } catch (error: any) {
    console.error(
      `[/api/getimages] Error fetching data from Firestore for category ${category}:`,
      error
    );
    return NextResponse.json(
      { error: "Failed to fetch images.", details: error.message },
      { status: 500 }
    );
  }
}
