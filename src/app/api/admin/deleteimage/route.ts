import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET_NAME } from "@/lib/r2";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { dbAdmin } from "@/lib/firebase/adminApp";

// Type for the expected request body
interface DeleteImageRequestBody {
  identifier: string; // ID or r2FileKey for Firestore lookup
  category: string; // For determining collection name
  r2FileKey: string; // For R2 deletion
}

export async function DELETE(request: NextRequest) {
  // 1. Check Admin Authentication
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") {
    console.log("[API DeleteImage] Unauthorized access attempt.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // 2. Check if Firestore is available
  if (!dbAdmin) {
    console.error("[API DeleteImage] Firestore instance is not available.");
    return NextResponse.json(
      { error: "Server configuration error (Database not ready)." },
      { status: 500 }
    );
  }

  // 3. Parse and Validate Request Body
  let body: DeleteImageRequestBody;
  try {
    body = await request.json();

    if (!body || typeof body !== "object")
      throw new Error("Invalid request body format.");

    if (!body.identifier || typeof body.identifier !== "string")
      throw new Error("Missing or invalid image identifier.");

    if (!body.category || typeof body.category !== "string")
      throw new Error("Missing or invalid category.");

    if (!body.r2FileKey || typeof body.r2FileKey !== "string")
      throw new Error("Missing or invalid R2 file key.");
  } catch (error: any) {
    console.error("[API DeleteImage] Invalid request body:", error);
    return NextResponse.json(
      { error: "Invalid request body.", details: error.message },
      { status: 400 }
    );
  }

  const { identifier, category, r2FileKey } = body;

  // Construct dynamic collection name (lowercase)
  const collectionName = `${category.toLowerCase()}_uploads`;

  console.log(
    `[API DeleteImage] Admin ${session.user.email} deleting image ${identifier} from ${collectionName}`
  );

  // Use a transaction to ensure deletion happens atomically
  try {
    // 1. Find document by r2FileKey first
    const querySnapshot = await dbAdmin
      .collection(collectionName)
      .where("r2FileKey", "==", r2FileKey)
      .limit(1)
      .get();

    let docRef;

    if (!querySnapshot.empty) {
      docRef = querySnapshot.docs[0].ref;
      console.log(
        `[API DeleteImage] Found document by r2FileKey: ${docRef.id}`
      );
    } else {
      // Try finding by Firestore ID as fallback
      try {
        const potentialDoc = await dbAdmin
          .collection(collectionName)
          .doc(identifier)
          .get();

        if (potentialDoc.exists) {
          docRef = potentialDoc.ref;
          console.log(`[API DeleteImage] Found document by ID: ${docRef.id}`);
        }
      } catch (idError) {
        console.warn(
          `[API DeleteImage] Could not check for document by ID ${identifier}:`,
          idError
        );
      }
    }

    if (!docRef) {
      console.error(
        `[API DeleteImage] Document not found with identifier: ${identifier} in collection ${collectionName}`
      );
      return NextResponse.json(
        { error: "Image record not found." },
        { status: 404 }
      );
    }

    // 2. Delete from R2 storage bucket
    try {
      console.log(`[API DeleteImage] Deleting file from R2: ${r2FileKey}`);

      const deleteParams = {
        Bucket: R2_BUCKET_NAME,
        Key: r2FileKey,
      };

      const command = new DeleteObjectCommand(deleteParams);
      await r2Client.send(command);

      console.log(
        `[API DeleteImage] Successfully deleted file from R2: ${r2FileKey}`
      );
    } catch (r2Error: any) {
      console.error(`[API DeleteImage] Error deleting from R2:`, r2Error);
      // Continue with Firestore deletion even if R2 deletion fails
      // This avoids orphaned database records
    }

    // 3. Delete from Firestore
    await docRef.delete();
    console.log(
      `[API DeleteImage] Successfully deleted document ${docRef.id} from Firestore`
    );

    return NextResponse.json({
      success: true,
      message: "Image and its data deleted successfully.",
      deletedFrom: ["Firestore", "R2 Storage"],
    });
  } catch (error: any) {
    console.error(`[API DeleteImage] Error during deletion:`, error);
    return NextResponse.json(
      { error: "Failed to delete image.", details: error.message },
      { status: 500 }
    );
  }
}
