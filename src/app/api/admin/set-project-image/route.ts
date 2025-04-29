import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET_NAME } from "@/lib/r2";
import { v4 as uuidv4 } from "uuid";
import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase/adminApp";
import { FieldValue } from "firebase-admin/firestore";

// --- Helper function for date validation ---
function isValidEventDateFormat(dateStr: string | null | undefined): boolean {
  if (!dateStr) return true; // Allow null/empty dates
  const trimmedStr = dateStr.trim();
  // Regex to match M/D/YYYY or M/D/YYYY - M/D/YYYY (flexible digits)
  const rangeRegex =
    /^(\d{1,2}\/\d{1,2}\/\d{4})\s*-\s*(\d{1,2}\/\d{1,2}\/\d{4})$/;
  const singleRegex = /^(\d{1,2}\/\d{1,2}\/\d{4})$/;

  const datesToValidate: string[] = [];

  const rangeMatch = trimmedStr.match(rangeRegex);
  if (rangeMatch) {
    datesToValidate.push(rangeMatch[1], rangeMatch[2]);
  } else {
    const singleMatch = trimmedStr.match(singleRegex);
    if (singleMatch) {
      datesToValidate.push(singleMatch[1]);
    } else {
      // Doesn't match either format
      return false;
    }
  }

  // Validate each extracted date string
  for (const dStr of datesToValidate) {
    const dateObj = new Date(dStr);
    // Check if Date constructor parsed it successfully and it's not an invalid date
    if (isNaN(dateObj.getTime())) {
      return false; // Invalid date like 02/30/2025
    }
  }

  return true; // Format is correct and all dates are valid
}
// --- End Helper function ---

// Assuming Request is NextRequest if middleware is used, otherwise use standard Request
export async function POST(request: NextRequest) {
  // Use NextRequest if needed
  if (!dbAdmin) {
    console.error(
      "[API SetProjectImage] Firestore instance (dbAdmin) is not available. Check lib/firebase/adminApp logs."
    );
    return NextResponse.json(
      { error: "Server configuration error (Database not ready)." },
      { status: 500 }
    );
  }
  console.log(
    "[/api/admin/set-project-image] POST request received. Firestore check passed."
  );

  try {
    // Use request.json() to get data from JSON body
    const { image } = await request.json(); // Expect { image: { ... } }

    // --- Validation ---
    if (!image || typeof image !== "object") {
      return NextResponse.json(
        { error: "Invalid request body. Expecting { image: { ... } }" },
        { status: 400 }
      );
    }

    // Extract key data from the nested image object
    const category = image.category;
    const imageKey = image.r2FileKey;
    const incomingMetadata = { ...image }; // Copy incoming data
    // Remove fields we manage separately or that shouldn't be directly set/overwritten
    delete incomingMetadata.id; // Firestore ID managed by Firestore
    delete incomingMetadata.src; // Derived field, not stored
    delete incomingMetadata.r2FileKey; // Used as identifier, not metadata
    delete incomingMetadata.category; // Used as identifier/query param, not metadata
    delete incomingMetadata.isProjectImage; // Handled specifically later
    delete incomingMetadata.projectImageSetAt; // Set by server
    delete incomingMetadata.createdAt; // Set by server on creation
    delete incomingMetadata.uploadedAt; // Should usually be set on initial upload

    if (!category || typeof category !== "string" || category.trim() === "") {
      return NextResponse.json(
        {
          error:
            "Category field within image object is required and must be a non-empty string.",
        },
        { status: 400 }
      );
    }
    if (!imageKey || typeof imageKey !== "string" || imageKey.trim() === "") {
      return NextResponse.json(
        {
          error:
            "r2FileKey field within image object is required and must be a non-empty string.",
        },
        { status: 400 }
      );
    }

    // Validate eventDate format from incoming metadata
    let validatedEventDate: string | null = null;
    if (incomingMetadata.eventDate) {
      const dateStr = String(incomingMetadata.eventDate).trim();
      if (isValidEventDateFormat(dateStr)) {
        validatedEventDate = dateStr;
      } else {
        console.warn(
          `[API SetProjectImage] Invalid event date format received: "${dateStr}". Storing null.`
        );
        // Optionally, return a 400 error if invalid date is unacceptable
        // return NextResponse.json({ error: `Invalid eventDate format: "${dateStr}". Use M/D/YYYY or M/D/YYYY - M/D/YYYY.` }, { status: 400 });
      }
    }
    // Ensure the metadata object uses the validated date (or null)
    incomingMetadata.eventDate = validatedEventDate;

    // --- Firestore Update Logic ---
    const collectionName = "portfolio_uploads"; // Target collection
    console.log(
      `[API SetProjectImage] Attempting to set project image and update metadata in '${collectionName}' for category '${category}' using image key '${imageKey}'`
    );

    let wasImageCreated = false; // Flag to track if a new doc was made

    await dbAdmin!.runTransaction(async (transaction) => {
      const collectionRef = dbAdmin!.collection(collectionName);

      // --- Step 1: Find the current project image for this category (if any) ---
      const currentProjectImageQuery = collectionRef
        .where("category", "==", category)
        .where("isProjectImage", "==", true)
        .limit(1);
      const currentProjectImageSnapshot = await transaction.get(
        currentProjectImageQuery
      );
      const currentProjectDoc =
        currentProjectImageSnapshot.docs.length > 0
          ? currentProjectImageSnapshot.docs[0]
          : null;

      // --- Step 2: Find the target image document by imageKey ---
      const targetImageQuery = collectionRef
        .where("r2FileKey", "==", imageKey)
        .limit(1);
      const targetImageSnapshot = await transaction.get(targetImageQuery);

      // --- Step 3: Process based on whether the target image exists ---
      if (!targetImageSnapshot.empty) {
        // **Target Image Exists - Update it**
        const targetImageDoc = targetImageSnapshot.docs[0];
        const targetImageData = targetImageDoc.data(); // Current data

        // Verify the category in the database matches (redundant check?)
        if (targetImageData.category !== category) {
          const mismatchError = new Error(
            `Database inconsistency: Image with key '${imageKey}' has category '${targetImageData.category}', expected '${category}'.`
          );
          (mismatchError as any).status = 500; // Internal error
          throw mismatchError;
        }

        // Delete the previous project image doc if it exists and is different
        if (currentProjectDoc && currentProjectDoc.id !== targetImageDoc.id) {
          console.log(
            `[API SetProjectImage Transaction] Deleting previous project image doc ${currentProjectDoc.id} in category '${category}'`
          );
          transaction.delete(currentProjectDoc.ref);
        }

        // Update the target image with new metadata and set as project image
        console.log(
          `[API SetProjectImage Transaction] Updating existing image ${targetImageDoc.id} (key: ${imageKey}) with new metadata and setting isProjectImage=true`
        );
        transaction.update(targetImageDoc.ref, {
          ...incomingMetadata, // Spread the validated & cleaned metadata
          isProjectImage: true,
          projectImageSetAt: FieldValue.serverTimestamp(),
          // Ensure essential fields aren't overwritten with null if not provided in partial update
          category: category, // Keep category consistent
          r2FileKey: imageKey, // Keep key consistent
        });
      } else {
        // **Target Image Does Not Exist - Create it**
        wasImageCreated = true; // Mark that we are creating it
        console.log(
          `[API SetProjectImage Transaction] Image with key '${imageKey}' not found. Creating new document with provided metadata.`
        );

        // Delete the previous project image doc if one exists
        if (currentProjectDoc) {
          console.log(
            `[API SetProjectImage Transaction] Deleting previous project image doc ${currentProjectDoc.id} before creating new one.`
          );
          transaction.delete(currentProjectDoc.ref);
        }

        // Create the new document with all provided metadata
        const newDocRef = collectionRef.doc(); // Auto-generate ID
        console.log(
          `[API SetProjectImage Transaction] Creating new image document ${newDocRef.id} with key '${imageKey}' as project image for category '${category}'`
        );
        transaction.set(newDocRef, {
          ...incomingMetadata, // Spread the validated & cleaned metadata
          r2FileKey: imageKey, // Set the key
          category: category, // Set the category
          isProjectImage: true, // Set as project image immediately
          projectImageSetAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(), // Add a creation timestamp
          uploadedAt: FieldValue.serverTimestamp(), // Set uploadedAt same as createdAt for new entries via this route
        });
      }
    });

    const successMessage = wasImageCreated
      ? `Image with key '${imageKey}' was not found, created a new record with the provided metadata and set it as the project image for category '${category}'.`
      : `Project image for category '${category}' successfully set to image with key '${imageKey}' and metadata updated.`;

    console.log(`[API SetProjectImage] ${successMessage}`);

    // --- Response ---
    return NextResponse.json(
      {
        message: successMessage,
        category: category,
        imageKey: imageKey,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as any; // Type assertion to access potential custom status
    const errorMessage =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    // Use custom status from transaction errors, default to 500
    const status = typeof err.status === "number" ? err.status : 500;

    console.error(
      `[API SetProjectImage] Error (Status: ${status}):`,
      errorMessage,
      error
    );

    // Specific check for JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: "Failed to set project image",
          details: "Invalid JSON format in request body.",
        },
        { status: 400 } // Bad Request for syntax errors
      );
    }

    return NextResponse.json(
      { error: "Failed to set project image", details: errorMessage },
      { status }
    );
  }
}

// Optional: Add OPTIONS handler if needed for CORS preflight requests
// export async function OPTIONS() {
//   return new Response(null, {
//     status: 204,
//     headers: {
//       'Access-Control-Allow-Origin': '*', // Adjust as needed
//       'Access-Control-Allow-Methods': 'POST, OPTIONS',
//       'Access-Control-Allow-Headers': 'Content-Type, Authorization',
//     },
//   });
// }
