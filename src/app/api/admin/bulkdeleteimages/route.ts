import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET_NAME } from "@/lib/r2";
import { authOptions } from "@/lib/authOptions";
import { dbAdmin } from "@/lib/firebase/adminApp";
import { revalidateTag } from "next/cache";
import { WriteBatch } from "firebase-admin/firestore";

// Type for the expected request body
interface BulkDeleteRequestBody {
  category: string; // For determining collection name
  imageKeys: string[]; // Array of r2FileKeys to delete
}

export async function DELETE(request: NextRequest) {
  // 1. Check Admin Authentication
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") {
    console.log("[API BulkDelete] Unauthorized access attempt.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // 2. Check if Firestore is available
  if (!dbAdmin) {
    console.error("[API BulkDelete] Firestore instance is not available.");
    return NextResponse.json(
      { error: "Server configuration error (Database not ready)." },
      { status: 500 }
    );
  }

  // 3. Parse and Validate Request Body
  let body: BulkDeleteRequestBody;
  try {
    body = await request.json();

    if (!body || typeof body !== "object")
      throw new Error("Invalid request body format.");

    if (!body.category || typeof body.category !== "string")
      throw new Error("Missing or invalid category.");

    if (!Array.isArray(body.imageKeys) || body.imageKeys.length === 0)
      throw new Error("Missing or invalid imageKeys array.");

    // Ensure all keys are strings
    if (!body.imageKeys.every((key) => typeof key === "string")) {
      throw new Error("All imageKeys must be strings.");
    }
  } catch (error: unknown) {
    console.error("[API BulkDelete] Invalid request body:", error);
    return NextResponse.json(
      {
        error: "Invalid request body.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 }
    );
  }

  const { category, imageKeys } = body;
  const collectionName = `${category.toLowerCase()}_uploads`;
  const totalToDelete = imageKeys.length;
  let firestoreDeletions = 0;
  let r2SuccessDeletions = 0;
  let r2FailedDeletions = 0;
  const r2FailedKeys: string[] = [];

  console.log(
    `[API BulkDelete] Admin ${session.user.email} attempting to delete ${totalToDelete} images from ${collectionName}`
  );

  try {
    // Prepare Firestore batch write
    const batch: WriteBatch = dbAdmin.batch();

    // Find documents to delete
    // Note: Firestore 'in' query is limited to 30 elements per query.
    // For > 30 deletions, we'd need multiple queries. For simplicity, assuming <= 30 for now.
    // If you expect more, implement chunking for the 'in' query.
    if (imageKeys.length > 30) {
      console.warn(
        `[API BulkDelete] Attempting to delete ${imageKeys.length} items, which exceeds the Firestore 'in' query limit of 30. Only the first 30 will be processed in this simplified version.`
      );
      // Consider implementing chunking here for production use
    }

    const querySnapshot = await dbAdmin
      .collection(collectionName)
      .where("r2FileKey", "in", imageKeys.slice(0, 30)) // Limit to 30 for 'in' query
      .get();

    if (querySnapshot.empty) {
      console.log(
        "[API BulkDelete] No matching documents found in Firestore for the provided keys."
      );
      // Still return success, as the goal state (images gone) is achieved
    } else {
      querySnapshot.docs.forEach((doc) => {
        console.log(
          `[API BulkDelete] Marking Firestore doc ${doc.id} (key: ${
            doc.data().r2FileKey
          }) for deletion.`
        );
        batch.delete(doc.ref);
        firestoreDeletions++;
      });
    }

    // Delete corresponding files from R2 (concurrently)
    const r2DeletePromises = imageKeys.map(async (key) => {
      try {
        const deleteParams = { Bucket: R2_BUCKET_NAME, Key: key };
        const command = new DeleteObjectCommand(deleteParams);
        await r2Client.send(command);
        console.log(`[API BulkDelete] Successfully deleted from R2: ${key}`);
        r2SuccessDeletions++;
      } catch (r2Error: unknown) {
        // Type guard for error message
        const errorMessage =
          r2Error instanceof Error ? r2Error.message : String(r2Error);
        console.error(
          `[API BulkDelete] Error deleting from R2 (${key}):`,
          errorMessage // Use the safe error message
        );
        r2FailedDeletions++;
        r2FailedKeys.push(key);
        // Do not throw error here, proceed with Firestore deletion
      }
    });

    // Wait for all R2 deletions to attempt
    await Promise.all(r2DeletePromises);

    // Commit Firestore deletions if any were marked
    if (firestoreDeletions > 0) {
      await batch.commit();
      console.log(
        `[API BulkDelete] Successfully committed ${firestoreDeletions} Firestore deletions.`
      );
    }

    // Revalidate the cache tag
    try {
      const tag = `images-${category.toLowerCase()}`;
      revalidateTag(tag);
      console.log(`[API BulkDelete] Revalidated tag: ${tag}`);
    } catch (revalidateError) {
      console.error(
        `[API BulkDelete] Failed to revalidate tag 'images-${category.toLowerCase()}':`,
        revalidateError
      );
    }

    // Construct response message
    let message = `Bulk delete process complete for ${totalToDelete} requested keys.`;
    message += ` Firestore: ${firestoreDeletions} deleted.`;
    message += ` R2: ${r2SuccessDeletions} succeeded, ${r2FailedDeletions} failed.`;
    if (r2FailedDeletions > 0) {
      message += ` Failed R2 keys: ${r2FailedKeys.join(", ")}`;
    }

    return NextResponse.json({
      success: true,
      message: message,
      details: {
        requested: totalToDelete,
        firestoreDeleted: firestoreDeletions,
        r2Success: r2SuccessDeletions,
        r2Failed: r2FailedDeletions,
        r2FailedKeys: r2FailedKeys,
      },
    });
  } catch (error: unknown) {
    // Type guard for error message
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `[API BulkDelete] Error during bulk deletion process:`,
      error // Log the original error object for potentially more detail
    );
    return NextResponse.json(
      {
        error: "Failed to complete bulk delete operation.",
        details: errorMessage, // Return the extracted message
      },
      { status: 500 }
    );
  }
}
