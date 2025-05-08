import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET_NAME } from "@/lib/r2";
import { v4 as uuidv4 } from "uuid";
import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase/adminApp";
import admin from "firebase-admin"; // Required for admin.firestore.Timestamp
import { FieldValue } from "firebase-admin/firestore";

// --- Helper function to parse event date string to a JavaScript Date object ---
// Parses M/D/YYYY or the start date of M/D/YYYY - M/D/YYYY
function parseEventDateToJsDate(
  dateStrInput: string | null | undefined
): Date | null {
  if (!dateStrInput) {
    return null;
  }
  const dateStr = dateStrInput.trim();

  // Regex to match M/D/YYYY or M/D/YYYY - M/D/YYYY (flexible digits for month/day)
  const rangeRegex =
    /^(\d{1,2}\/\d{1,2}\/\d{4})\s*-\s*(\d{1,2}\/\d{1,2}\/\d{4})$/;
  const singleRegex = /^(\d{1,2}\/\d{1,2}\/\d{4})$/;

  let dateStringToParse: string | null = null;

  const rangeMatch = dateStr.match(rangeRegex);
  if (rangeMatch) {
    dateStringToParse = rangeMatch[1]; // Use the start date of the range
  } else {
    const singleMatch = dateStr.match(singleRegex);
    if (singleMatch) {
      dateStringToParse = singleMatch[1];
    } else {
      // Doesn't match either expected format
      console.warn(
        `[Upload API Helper] Event date string "${dateStr}" does not match expected M/D/YYYY or M/D/YYYY - M/D/YYYY format.`
      );
      return null;
    }
  }

  if (!dateStringToParse) return null; // Should not happen if logic above is correct

  // Attempt to parse the M/D/YYYY string
  const parts = dateStringToParse.split("/");
  if (parts.length === 3) {
    const month = parseInt(parts[0], 10) - 1; // JS months are 0-indexed
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    // Basic validation for parts
    if (isNaN(month) || isNaN(day) || isNaN(year)) {
      console.warn(
        `[Upload API Helper] Invalid date parts in "${dateStringToParse}"`
      );
      return null;
    }

    const dateObj = new Date(year, month, day);
    // Check if Date constructor parsed it successfully, it's a valid date,
    // and the components match (e.g., not 02/30/2025 which becomes 03/02/2025)
    if (
      isNaN(dateObj.getTime()) ||
      dateObj.getFullYear() !== year ||
      dateObj.getMonth() !== month ||
      dateObj.getDate() !== day
    ) {
      console.warn(
        `[Upload API Helper] Invalid date created from "${dateStringToParse}" (e.g., 02/30/2025).`
      );
      return null;
    }
    return dateObj;
  }
  return null; // Should be caught by regex if not M/D/YYYY
}
// --- End Helper function ---

interface FileSpecificMetadata {
  photographer: string | null;
  photographerLink?: string | null;
  eventDate: string | null; // This will store the original string input
  eventEndDate?: string | null;
  location: string | null;
  locationLink?: string | null;
  event: string | null;
  eventLink?: string | null;
  advertising?: string | null;
  advertisingLink?: string | null;
  originalFilename: string;
}

export async function POST(request: NextRequest) {
  if (!dbAdmin) {
    console.error(
      "[Upload API] Firestore instance (dbAdmin) is not available."
    );
    return NextResponse.json(
      { error: "Server configuration error (Database not ready)." },
      { status: 500 }
    );
  }
  console.log(
    "[/api/uploadimages] POST request received. Firestore check passed."
  );

  try {
    const formData = await request.formData();
    const files: File[] = [];
    let category: string | null = null;
    let metadataArrayString: string | null = null;

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        files.push(value);
      } else {
        if (key === "category") category = value;
        else if (key === "metadataArray") metadataArrayString = value;
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }
    if (!category) {
      return NextResponse.json(
        { error: "Category is required." },
        { status: 400 }
      );
    }

    let parsedMetadata: FileSpecificMetadata[] = [];
    if (!metadataArrayString) {
      return NextResponse.json(
        { error: "Missing metadata array." },
        { status: 400 }
      );
    }
    try {
      parsedMetadata = JSON.parse(metadataArrayString);
      if (!Array.isArray(parsedMetadata))
        throw new Error("Metadata is not an array.");
    } catch (parseError: unknown) {
      const errorMessage =
        parseError instanceof Error ? parseError.message : String(parseError);
      return NextResponse.json(
        { error: "Invalid metadata format.", details: errorMessage },
        { status: 400 }
      );
    }

    const metadataMap = new Map(
      parsedMetadata.map((meta) => [meta.originalFilename, meta])
    );
    const results = [];
    let successfulUploads = 0;
    const errors: string[] = [];
    const collectionName = `${category
      .toLowerCase()
      .replace(/\s+/g, "_")}_uploads`;

    console.log(
      `[/api/uploadimages] Using Firestore collection: ${collectionName}`
    );

    for (const file of files) {
      const currentFileName = file.name || "unknownfile";
      console.log(`[/api/uploadimages] Processing file: ${currentFileName}`);
      try {
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const fileKey = `uploads/${uuidv4()}-${currentFileName}`;

        await r2Client.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: fileKey,
            Body: fileBuffer,
            ContentType: file.type || "application/octet-stream",
          })
        );
        console.log(
          `[/api/uploadimages] Successfully uploaded ${fileKey} to R2.`
        );

        const specificMetadata = metadataMap.get(currentFileName);
        if (!specificMetadata) {
          console.warn(
            `[/api/uploadimages] Metadata not found for file: ${currentFileName}.`
          );
          // errors.push(`Metadata missing for ${currentFileName}`); // Optional: decide if this is an error
        }

        // --- Process eventDate for eventStartDate (Timestamp) and keep original eventDate (string) ---
        const originalEventDateString =
          specificMetadata?.eventDate?.trim() || null;
        let eventStartDateTimestamp: admin.firestore.Timestamp | null = null;

        if (originalEventDateString) {
          const jsDate = parseEventDateToJsDate(originalEventDateString);
          if (jsDate) {
            eventStartDateTimestamp =
              admin.firestore.Timestamp.fromDate(jsDate);
            console.log(
              `[/api/uploadimages] Derived eventStartDate (Timestamp) for ${currentFileName}: ${eventStartDateTimestamp
                .toDate()
                .toISOString()}`
            );
          } else {
            console.warn(
              `[/api/uploadimages] Could not parse valid JS Date from eventDate string "${originalEventDateString}" for ${currentFileName}. eventStartDate will be null.`
            );
          }
        } else {
          console.log(
            `[/api/uploadimages] No eventDate string provided for ${currentFileName}. eventStartDate will be null.`
          );
        }
        // --- End eventDate processing ---

        const uploadData = {
          r2FileKey: fileKey,
          originalFilename: currentFileName,
          contentType: file.type || "application/octet-stream",
          photographer: specificMetadata?.photographer || null,
          photographerLink: specificMetadata?.photographerLink || null,
          eventDate: originalEventDateString, // Store the original string (trimmed or null)
          eventStartDate: eventStartDateTimestamp, // Store Firestore Timestamp or null
          // eventEndDate: specificMetadata?.eventEndDate || null, // Keep if you use it
          location: specificMetadata?.location || null,
          locationLink: specificMetadata?.locationLink || null,
          event: specificMetadata?.event || null,
          eventLink: specificMetadata?.eventLink || null,
          category: category,
          uploadedAt: FieldValue.serverTimestamp(),
          advertisingLink: specificMetadata?.advertisingLink || null,
        };

        console.log(
          `[/api/uploadimages] Saving Firestore data for ${currentFileName}... Data:`,
          JSON.stringify(uploadData, null, 2)
        );
        const docRef = await dbAdmin.collection(collectionName).add(uploadData);
        console.log(
          `[/api/uploadimages] Firestore save successful for ${currentFileName}. Doc ID: ${docRef.id}`
        );

        results.push({
          fileKey: fileKey,
          originalFilename: currentFileName,
          firestoreDocId: docRef.id,
        });
        successfulUploads++;
      } catch (processError: unknown) {
        const errorMessage =
          processError instanceof Error
            ? processError.message
            : String(processError);
        console.error(
          `[/api/uploadimages] Error processing file ${currentFileName}:`,
          errorMessage,
          processError
        );
        errors.push(`Failed for ${currentFileName}: ${errorMessage}`);
      }
    } // End loop

    if (successfulUploads === files.length) {
      return NextResponse.json(
        {
          message: `${successfulUploads} file(s) uploaded and metadata saved successfully`,
          count: successfulUploads,
          results: results,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          message: `Processed ${files.length} file(s). Successful: ${successfulUploads}, Failed: ${errors.length}`,
          count: successfulUploads,
          results: results,
          errors: errors,
        },
        { status: successfulUploads > 0 ? 207 : 500 }
      );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      "[/api/uploadimages] Unhandled error in POST handler:",
      error
    );
    if (
      error instanceof TypeError &&
      errorMessage.includes("Could not parse content as FormData")
    ) {
      return NextResponse.json(
        { error: "Invalid form data format.", details: errorMessage },
        { status: 400 }
      );
    }
    // Add other specific error checks if needed
    return NextResponse.json(
      { error: "Failed to process upload.", details: errorMessage },
      { status: 500 }
    );
  }
}
