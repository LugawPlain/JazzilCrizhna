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
export async function PUT(request: NextRequest) {
  const endpoint = "/api/admin/set-portfolio-image"; // For consistent log prefix
  const logPrefix = `[${endpoint}]`;

  if (!dbAdmin) {
    console.error(
      `${logPrefix} Firestore instance (dbAdmin) is not available. Check lib/firebase/adminApp logs.`
    );
    return NextResponse.json(
      { error: "Server configuration error (Database not ready)." },
      { status: 500 }
    );
  }
  console.log(`${logPrefix} PUT request received. Firestore check passed.`);

  let requestBody: any;
  try {
    requestBody = await request.json();
    console.log(`${logPrefix} Successfully parsed request body.`);
  } catch (parseError) {
    console.error(
      `${logPrefix} Failed to parse request body as JSON:`,
      parseError
    );
    return NextResponse.json(
      { error: "Invalid JSON in request body." },
      { status: 400 }
    );
  }

  try {
    const { image } = requestBody; // Expect { image: { ... } }

    // --- Validation ---
    console.log(
      `${logPrefix} Starting validation... Received image data:`,
      image
    );
    if (!image || typeof image !== "object") {
      console.error(
        `${logPrefix} Validation failed: Invalid request body structure.`
      );
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
      console.error(
        `${logPrefix} Validation failed: Category missing or invalid. Received:`,
        category
      );
      return NextResponse.json(
        {
          error:
            "Category field within image object is required and must be a non-empty string.",
        },
        { status: 400 }
      );
    }
    if (!imageKey || typeof imageKey !== "string" || imageKey.trim() === "") {
      console.error(
        `${logPrefix} Validation failed: r2FileKey missing or invalid. Received:`,
        imageKey
      );
      return NextResponse.json(
        {
          error:
            "r2FileKey field within image object is required and must be a non-empty string.",
        },
        { status: 400 }
      );
    }
    console.log(
      `${logPrefix} Basic validation passed for category '${category}' and key '${imageKey}'.`
    );

    // Validate eventDate format from incoming metadata
    let validatedEventDate: string | null = null;
    if (incomingMetadata.eventDate) {
      const dateStr = String(incomingMetadata.eventDate).trim();
      console.log(`${logPrefix} Validating eventDate: '${dateStr}'`);
      if (isValidEventDateFormat(dateStr)) {
        validatedEventDate = dateStr;
        console.log(`${logPrefix} eventDate validation successful.`);
      } else {
        console.warn(
          `${logPrefix} Invalid event date format received: "${dateStr}". Storing null.`
        );
      }
    } else {
      console.log(`${logPrefix} No eventDate provided in incoming metadata.`);
    }
    // Ensure the metadata object uses the validated date (or null)
    incomingMetadata.eventDate = validatedEventDate;
    console.log(
      `${logPrefix} Cleaned metadata to be saved (excluding keys/category):`,
      incomingMetadata
    );

    // --- Firestore Update Logic ---
    const collectionName = "portfolio_uploads"; // Target collection
    console.log(
      `${logPrefix} Attempting transaction in '${collectionName}' for category '${category}', key '${imageKey}'`
    );

    let wasImageCreated = false; // Flag to track if a new doc was made

    await dbAdmin!.runTransaction(async (transaction) => {
      console.log(`${logPrefix} Transaction started.`);
      const collectionRef = dbAdmin!.collection(collectionName);

      // --- Step 1: Find the current project image ---
      console.log(
        `${logPrefix} Querying for current project image in category '${category}'...`
      );
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
      if (currentProjectDoc) {
        console.log(
          `${logPrefix} Found current project image: ID ${
            currentProjectDoc.id
          }, Key ${currentProjectDoc.data().r2FileKey}`
        );
      } else {
        console.log(
          `${logPrefix} No current project image found for category '${category}'.`
        );
      }

      // --- Step 2: Find the target image document by imageKey ---
      console.log(
        `${logPrefix} Querying for target image with key '${imageKey}'...`
      );
      const targetImageQuery = collectionRef
        .where("r2FileKey", "==", imageKey)
        .limit(1);
      const targetImageSnapshot = await transaction.get(targetImageQuery);

      // --- Step 3: Process based on whether the target image exists ---
      if (!targetImageSnapshot.empty) {
        // **Target Image Exists - Update it**
        const targetImageDoc = targetImageSnapshot.docs[0];
        const targetImageData = targetImageDoc.data();
        console.log(
          `${logPrefix} Target image found: ID ${targetImageDoc.id}. Current data:`,
          targetImageData
        );

        if (targetImageData.category !== category) {
          // This check might be redundant if your logic ensures keys are unique per category
          console.error(
            `${logPrefix} Database inconsistency detected! Image ${targetImageDoc.id} (key: ${imageKey}) has category '${targetImageData.category}', but expected '${category}'.`
          );
          const mismatchError = new Error(
            `Database inconsistency: Image key '${imageKey}' category mismatch.`
          );
          (mismatchError as any).status = 500;
          throw mismatchError;
        }

        // Unset previous project image if it exists and is different
        if (currentProjectDoc && currentProjectDoc.id !== targetImageDoc.id) {
          console.log(
            `${logPrefix} Deleting previous project image document: ID ${currentProjectDoc.id}. Transaction: delete.`
          );
          transaction.delete(currentProjectDoc.ref);
        } else if (
          currentProjectDoc &&
          currentProjectDoc.id === targetImageDoc.id
        ) {
          console.log(
            `${logPrefix} Target image is already the current project image. Will update metadata.`
          );
        }

        const updateData = {
          ...incomingMetadata, // Spread the validated & cleaned metadata
          isProjectImage: true,
          projectImageSetAt: FieldValue.serverTimestamp(),
          // Ensure essential fields aren't overwritten with null if not provided
          category: category,
          r2FileKey: imageKey,
        };
        console.log(
          `${logPrefix} Updating existing image ${targetImageDoc.id}. Transaction: update. Data:`,
          updateData
        );
        transaction.update(targetImageDoc.ref, updateData);
      } else {
        // **Target Image Does Not Exist - Create it**
        wasImageCreated = true;
        console.log(
          `${logPrefix} Target image with key '${imageKey}' not found.`
        );

        // Unset previous project image if one exists
        if (currentProjectDoc) {
          console.log(
            `${logPrefix} Deleting previous project image document: ID ${currentProjectDoc.id} before creating new one. Transaction: delete.`
          );
          transaction.delete(currentProjectDoc.ref);
        }

        const newDocRef = collectionRef.doc(); // Auto-generate ID
        const setData = {
          ...incomingMetadata,
          r2FileKey: imageKey,
          category: category,
          isProjectImage: true,
          projectImageSetAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
          uploadedAt: FieldValue.serverTimestamp(), // Set timestamps for new doc
        };
        console.log(
          `${logPrefix} Creating new image document ${newDocRef.id} as project image. Transaction: set. Data:`,
          setData
        );
        transaction.set(newDocRef, setData);
      }
      console.log(`${logPrefix} Transaction operations queued.`);
    });
    console.log(`${logPrefix} Transaction completed successfully.`);

    const successMessage = wasImageCreated
      ? `Image with key '${imageKey}' was not found, created new record and set as project image for '${category}'.`
      : `Project image for category '${category}' set to image key '${imageKey}', metadata updated.`;

    console.log(`${logPrefix} Success: ${successMessage}`);

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
    const err = error as any;
    const errorMessage =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    const status = typeof err.status === "number" ? err.status : 500;

    console.error(
      `${logPrefix} Error during processing (Status: ${status}): ${errorMessage}`,
      err // Log the full error object
    );

    // Specific check for JSON parsing errors (redundant due to initial check, but safe)
    if (error instanceof SyntaxError) {
      console.error(`${logPrefix} Responding with 400 due to SyntaxError.`);
      return NextResponse.json(
        {
          error: "Failed to set project image",
          details: "Invalid JSON format in request body.",
        },
        { status: 400 }
      );
    }

    console.error(
      `${logPrefix} Responding with ${status} due to caught error.`
    );
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
