import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET_NAME } from "@/lib/r2";
import formidable, { errors as FormidableErrors } from "formidable";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { NextRequest, NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase/adminApp"; // <--- Import CORRECT export 'dbAdmin'
import { FieldValue } from "firebase-admin/firestore"; // Keep FieldValue if used

interface FileSpecificMetadata {
  photographer: string | null;
  photographerLink: string | null;
  eventDate: string | null;
  location: string | null;
  event: string | null;
  originalFilename: string;
}

export async function POST(request: NextRequest) {
  // --- Use the imported dbAdmin instance ---
  if (!dbAdmin) {
    console.error(
      "[Upload API] Firestore instance (dbAdmin) is not available. Check lib/firebase/adminApp logs."
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
    console.log(
      "[/api/uploadimages] Parsing form data using request.formData()..."
    );
    const formData = await request.formData();
    console.log("[/api/uploadimages] Form data parsed successfully.");

    // --- Extract files and fields from FormData ---
    console.log("[/api/uploadimages] Extracting fields and files...");
    const files: File[] = []; // Use the global File type (Web API)
    let category: string | null = null;
    let metadataArrayString: string | null = null;

    for (const [key, value] of formData.entries()) {
      // Check against the global File constructor
      if (value instanceof File) {
        files.push(value);
      } else {
        // It's a simple field
        if (key === "category") {
          category = value;
        } else if (key === "metadataArray") {
          metadataArrayString = value;
        }
      }
    }
    console.log(`[/api/uploadimages] Extracted Category: ${category}`);
    console.log(
      `[/api/uploadimages] Extracted Metadata String: ${
        metadataArrayString ? "Exists" : "Missing"
      }`
    );
    console.log(
      `[/api/uploadimages] Found ${files.length} file(s) in form data.`
    );

    // Check if any files were uploaded
    if (files.length === 0) {
      console.log("[/api/uploadimages] No files found in upload.");
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    // Backend validation for category
    if (!category) {
      console.log("[/api/uploadimages] Category validation failed.");
      return NextResponse.json(
        { error: "Category is required." },
        { status: 400 }
      );
    }
    console.log("[/api/uploadimages] Category validation passed.");

    // --- Parse the metadata array (logic remains similar) ---
    let parsedMetadata: FileSpecificMetadata[] = []; // Use defined interface
    if (!metadataArrayString) {
      console.log("[/api/uploadimages] Metadata array string is missing.");
      return NextResponse.json(
        { error: "Missing metadata array." },
        { status: 400 }
      );
    }
    try {
      console.log("[/api/uploadimages] Parsing metadata array string...");
      parsedMetadata = JSON.parse(metadataArrayString);
      if (!Array.isArray(parsedMetadata)) {
        throw new Error("Metadata is not an array.");
      }
      // Optional: Add more validation for the structure of each metadata object
      console.log(
        `[/api/uploadimages] Metadata array parsed successfully. Found ${parsedMetadata.length} items.`
      );
      // Validate if metadata count matches file count
      if (parsedMetadata.length !== files.length) {
        console.warn(
          `[/api/uploadimages] Mismatch: Found ${files.length} files but ${parsedMetadata.length} metadata entries.`
        );
        // Decide how to handle mismatch - error out? proceed carefully?
        // For now, we'll proceed but rely on filename matching.
        // Consider returning an error for stricter validation:
        // throw new Error("Mismatch between number of files and metadata entries.");
      }
    } catch (parseError: any) {
      console.error(
        "[/api/uploadimages] Failed to parse metadataArray:",
        parseError
      );
      return NextResponse.json(
        { error: "Invalid metadata format.", details: parseError.message },
        { status: 400 }
      );
    }

    // --- Create a map for quick metadata lookup by filename (logic remains similar) ---
    console.log("[/api/uploadimages] Creating metadata map...");
    const metadataMap = new Map(
      parsedMetadata.map((meta) => [meta.originalFilename, meta])
    );
    console.log("[/api/uploadimages] Metadata map created.");

    // --- Process each file ---
    const results = [];
    let successfulUploads = 0;
    let errors: string[] = [];

    const collectionName = `${category
      .toLowerCase()
      .replace(/\s+/g, "_")}_uploads`;
    console.log(
      `[/api/uploadimages] Using Firestore collection: ${collectionName}`
    );

    console.log("[/api/uploadimages] Starting file processing loop...");
    for (const file of files) {
      // file here is the global File type
      const currentFileName = file.name || "unknownfile"; // Use file.name
      console.log(`[/api/uploadimages] Processing file: ${currentFileName}`);
      try {
        // --- R2 Upload using File object ---
        const fileBuffer = Buffer.from(await file.arrayBuffer()); // Use file.arrayBuffer()

        const fileKey = `uploads/${uuidv4()}-${currentFileName}`;

        const uploadParams = {
          Bucket: R2_BUCKET_NAME,
          Key: fileKey,
          Body: fileBuffer,
          ContentType: file.type || "application/octet-stream", // Use file.type
        };
        console.log(`[/api/uploadimages] Uploading ${fileKey} to R2...`);
        const command = new PutObjectCommand(uploadParams);
        await r2Client.send(command);
        console.log(
          `[/api/uploadimages] Successfully uploaded ${fileKey} to R2.`
        );
        // No temporary file path to check or delete anymore

        // --- Firestore Save (logic remains similar, using metadataMap) ---
        let firestoreDocId: string | null = null;
        try {
          console.log(
            `[/api/uploadimages] Looking up metadata for ${currentFileName}...`
          );
          const specificMetadata = metadataMap.get(currentFileName);

          if (!specificMetadata) {
            console.warn(
              `[/api/uploadimages] Metadata not found for file: ${currentFileName}.`
            );
            errors.push(`Metadata missing for ${currentFileName}`);
            // Continue or error out based on requirements
            // continue;
          }
          console.log(
            `[/api/uploadimages] Found metadata for ${currentFileName}:`,
            specificMetadata || "Not Found"
          );

          console.log(
            `[/api/uploadimages] Constructing Firestore data for ${currentFileName}...`
          );

          // Handle eventDate as string for date ranges or as Date object for single dates
          let eventDateValue = null;
          if (specificMetadata?.eventDate) {
            const dateStr = specificMetadata.eventDate.trim();

            // Check if it contains a range (has a hyphen)
            if (dateStr.includes(" - ")) {
              // For ranges, keep as string
              eventDateValue = dateStr;
              console.log(
                `[/api/uploadimages] Using date range for ${currentFileName}: "${dateStr}"`
              );
            } else {
              // For single dates, try to convert to Date object
              try {
                const dateObj = new Date(dateStr);
                if (!isNaN(dateObj.getTime())) {
                  eventDateValue = dateObj;
                } else {
                  console.warn(
                    `[/api/uploadimages] Invalid single date format for ${currentFileName}: "${dateStr}"`
                  );
                }
              } catch (dateError) {
                console.error(
                  `[/api/uploadimages] Error parsing date for ${currentFileName}:`,
                  dateError
                );
              }
            }
          }

          const uploadData = {
            r2FileKey: fileKey,
            originalFilename: currentFileName,
            contentType: file.type || "application/octet-stream", // Use file.type
            photographer: specificMetadata?.photographer || null,
            photographerLink: specificMetadata?.photographerLink || null,
            eventDate: eventDateValue, // Now can be string or Date or null
            location: specificMetadata?.location || null,
            event: specificMetadata?.event || null,
            category: category,
            uploadedAt: FieldValue.serverTimestamp(),
          };
          console.log(
            `[/api/uploadimages] Firestore data for ${currentFileName}:`,
            `uploadData:`,
            uploadData
          );

          console.log(
            `[/api/uploadimages] Saving Firestore data for ${currentFileName} to collection ${collectionName}...`
          );
          const docRef = await dbAdmin
            .collection(collectionName)
            .add(uploadData);
          firestoreDocId = docRef.id;
          console.log(
            `[/api/uploadimages] Firestore save successful for ${currentFileName}. Doc ID: ${firestoreDocId}`
          );

          results.push({
            fileKey: fileKey,
            originalFilename: currentFileName,
            firestoreDocId: firestoreDocId,
          });
          successfulUploads++;
        } catch (firestoreError: any) {
          console.error(
            `[/api/uploadimages] Error saving metadata to Firestore for ${currentFileName}:`,
            firestoreError
          );
          errors.push(
            `Failed to save metadata for ${currentFileName}: ${firestoreError.message}`
          );
          // Consider R2 cleanup here
        }
        // No temporary file cleanup needed
      } catch (uploadError: any) {
        console.error(
          `[/api/uploadimages] Error processing file ${currentFileName}:`,
          uploadError
        );
        errors.push(
          `Failed to upload ${currentFileName}: ${uploadError.message}`
        );
        // No temporary file cleanup needed here either
      }
    } // End loop
    console.log("[/api/uploadimages] Finished file processing loop.");

    // --- Consolidate Response (logic remains the same) ---
    console.log(
      `[/api/uploadimages] Consolidating response. Successful: ${successfulUploads}, Failed: ${errors.length}`
    );
    if (successfulUploads === files.length) {
      return NextResponse.json(
        {
          message: `${successfulUploads} file(s) uploaded and metadata saved successfully`,
          count: successfulUploads,
          results: results, // Array of successful upload details
        },
        { status: 200 }
      );
    } else {
      // Partial success or complete failure
      const status = successfulUploads > 0 ? 207 : 500; // 207 Multi-Status or 500 Internal Server Error
      return NextResponse.json(
        {
          message: `Processed ${files.length} file(s). Successful: ${successfulUploads}, Failed: ${errors.length}`,
          count: successfulUploads,
          results: results, // Successful ones
          errors: errors, // List of errors
        },
        { status: status }
      );
    }
  } catch (error: any) {
    console.error(
      "[/api/uploadimages] Unhandled error in POST handler:",
      error
    );
    // Check if it's a specific error type that formData() might throw
    if (
      error instanceof TypeError &&
      error.message.includes("Could not parse content as FormData")
    ) {
      return NextResponse.json(
        { error: "Invalid form data format.", details: error.message },
        { status: 400 }
      );
    }
    // Check for AWS SDK errors
    if (error.name === "NoSuchBucket") {
      return NextResponse.json(
        { error: "R2 bucket not found." },
        { status: 404 }
      );
    }

    // Check if it's a Firebase Admin init error (though ideally caught earlier)
    if (error.message.includes("GOOGLE_APPLICATION_CREDENTIALS")) {
      return NextResponse.json(
        {
          error: "Server configuration error (Firebase).",
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Generic error
    return NextResponse.json(
      { error: "Failed to process upload.", details: error.message }, // Changed error message
      { status: 500 }
    );
  }
}
