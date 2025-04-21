import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { dbAdmin } from "@/lib/firebase/adminApp"; // <--- Import CORRECT export 'dbAdmin'

export async function POST(request: NextRequest) {
  // 1. Check authentication and authorization
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") {
    console.warn("[API/toggle-pin] Unauthorized attempt.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // --- Use the imported dbAdmin instance ---
  if (!dbAdmin) {
    // <-- Check dbAdmin
    console.error(
      "[API/toggle-pin] Firestore instance (dbAdmin) is not available. Check lib/firebase/adminApp logs."
    );
    return NextResponse.json(
      { error: "Server configuration error (Database not ready)." },
      { status: 500 }
    );
  }

  // 2. Parse request body
  let r2FileKey: string | undefined;
  let pin: boolean | undefined;
  let category: string | undefined; // <-- Add category variable
  try {
    const body = await request.json();
    r2FileKey = body.r2FileKey;
    pin = body.pin;
    category = body.category; // <-- Parse category from body

    if (typeof r2FileKey !== "string" || r2FileKey.length === 0) {
      throw new Error("Missing or invalid r2FileKey");
    }
    if (typeof pin !== "boolean") {
      throw new Error("Missing or invalid pin status");
    }
    if (typeof category !== "string" || category.length === 0) {
      // <-- Validate category
      throw new Error("Missing or invalid category");
    }

    // Log successfully parsed data
    console.log(
      `[API/toggle-pin] Parsed request: { r2FileKey: '${r2FileKey}', pin: ${pin}, category: '${category}' }`
    );
  } catch (error) {
    console.error("[API/toggle-pin] Invalid request body:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  // Construct dynamic collection name, ensuring lowercase
  const collectionName = `${category.toLowerCase()}_uploads`; // <-- Convert to lowercase
  console.log(
    `[API/toggle-pin] Using dynamic collection (forced lowercase): '${collectionName}'`
  );
  const dynamicCollection = dbAdmin.collection(collectionName); // <-- Use dbAdmin

  console.log(
    `[API/toggle-pin] Admin ${session.user.email} attempting action.`
  );

  try {
    // 3. Find the document by r2FileKey within the dynamic collection
    console.log(
      `[API/toggle-pin] Querying collection '${collectionName}' for r2FileKey: '${r2FileKey}'`
    );
    const querySnapshot = await dynamicCollection
      .where("r2FileKey", "==", r2FileKey)
      .limit(1)
      .get();

    // Log query results
    console.log(
      `[API/toggle-pin] Firestore query found ${querySnapshot.size} document(s).`
    );

    if (querySnapshot.empty) {
      console.error(`[API/toggle-pin] Image not found with key: ${r2FileKey}`);
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // 4. Update the document
    const docRef = querySnapshot.docs[0].ref;
    // Log document ID before update
    console.log(
      `[API/toggle-pin] Attempting to update document ID: ${docRef.id} with isPinned: ${pin}`
    );
    await docRef.update({ isPinned: pin });

    console.log(
      `[API/toggle-pin] Successfully updated pin status for key: ${r2FileKey}`
    );
    return NextResponse.json({
      success: true,
      r2FileKey: r2FileKey,
      pinned: pin,
    });
  } catch (error) {
    console.error(
      `[API/toggle-pin] Error during Firestore operation for key '${r2FileKey}':`,
      error
    );
    return NextResponse.json(
      { error: "Internal server error occurred" },
      { status: 500 }
    );
  }
}
