import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET_NAME } from "@/lib/r2";
import formidable, { errors as FormidableErrors } from "formidable";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { NextRequest, NextResponse } from "next/server";
import type { File } from "formidable"; // Import File type
import admin from "firebase-admin"; // Import firebase-admin
import { FieldValue } from "firebase-admin/firestore"; // Import FieldValue for timestamp

// --- Firebase Admin Initialization ---
// Ensure this only runs once
if (!admin.apps.length) {
  try {
    // Option 1: Use environment variable for service account key path
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!serviceAccountPath) {
      throw new Error(
        "GOOGLE_APPLICATION_CREDENTIALS environment variable not set."
      );
    }
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
      // Add your databaseURL if needed, e.g.:
      // databaseURL: "https://your-project-id.firebaseio.com"
    });
    console.log("Firebase Admin initialized successfully.");

    // Option 2: Use environment variable for service account JSON content
    // const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    // if (!serviceAccountJson) {
    //   throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON environment variable not set.");
    // }
    // admin.initializeApp({
    //   credential: admin.credential.cert(JSON.parse(serviceAccountJson)),
    // });
    // console.log("Firebase Admin initialized successfully from JSON env var.");
  } catch (error: any) {
    console.error("Firebase Admin initialization error:", error.message);
    // Decide how to handle initialization errors - maybe prevent the route from working?
    // For now, we'll just log it. The route might fail later if admin is not initialized.
  }
}

const db = admin.firestore(); // Get Firestore instance
// --- End Firebase Admin Initialization ---

// Helper function to parse form data
async function parseFormData(
  req: NextRequest
): Promise<{ fields: formidable.Fields; files: formidable.Files }> {
  return new Promise((resolve, reject) => {
    const form = formidable({});
    // formidable expects Node.js IncomingMessage, adapt NextRequest
    // This adaptation might need refinement based on deployment environment (Node/Edge)
    // For Node.js runtime:
    form.parse(
      req as any,
      (err: any, fields: formidable.Fields, files: formidable.Files) => {
        if (err) {
          reject(err);
        }
        resolve({ fields, files });
      }
    );
    // Note: For Edge runtime, req.formData() might be a better approach,
    // but requires handling file streams differently.
  });
}

export async function POST(request: NextRequest) {
  // Remove the method check, as the function name `POST` handles it

  if (!admin.apps.length) {
    console.error(
      "Firebase Admin SDK is not initialized. Cannot process upload."
    );
    return NextResponse.json(
      { error: "Server configuration error." },
      { status: 500 }
    );
  }

  try {
    const { fields, files } = await parseFormData(request);

    // Extract metadata from fields (formidable wraps fields in arrays)
    // const photographer = fields.photographer?.[0] || null; // No longer needed globally here
    // const photographerLink = fields.photographerLink?.[0] || null; // Assuming not sent per file, keep if needed
    // const date = fields.date?.[0] || null; // No longer needed globally here
    // const event = fields.event?.[0] || null; // No longer needed globally here
    const category = fields.category?.[0] || null; // Still needed globally for collection name
    const metadataArrayString = fields.metadataArray?.[0] || null; // Get the JSON string

    // formidable v3+ wraps files in arrays
    // --- Handle multiple files ---
    const filesArray = (files.file as File[]) || []; // Expect an array of files
    // const file = (files.file?.[0] as File) || null; // Old single file logic

    // Check if any files were uploaded
    if (filesArray.length === 0) {
      // if (!file) { // Old check
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    // --- Backend validation for category ---
    if (!category) {
      return NextResponse.json(
        { error: "Category is required." },
        { status: 400 }
      );
    }
    // --- End validation ---

    // --- Parse the metadata array ---
    let parsedMetadata: any[] = [];
    if (!metadataArrayString) {
      return NextResponse.json(
        { error: "Missing metadata array." },
        { status: 400 }
      );
    }
    try {
      parsedMetadata = JSON.parse(metadataArrayString);
      if (!Array.isArray(parsedMetadata)) {
        throw new Error("Metadata is not an array.");
      }
      // Optional: Add more validation for the structure of each metadata object
    } catch (parseError: any) {
      console.error("Failed to parse metadataArray:", parseError);
      return NextResponse.json(
        { error: "Invalid metadata format.", details: parseError.message },
        { status: 400 }
      );
    }

    // --- Create a map for quick metadata lookup by filename ---
    const metadataMap = new Map(
      parsedMetadata.map((meta) => [meta.originalFilename, meta])
    );

    // --- Process each file ---
    const results = [];
    let successfulUploads = 0;
    let errors: string[] = [];

    // Sanitize category name for collection ID (do this once)
    const collectionName = `${category
      .toLowerCase()
      .replace(/\s+/g, "_")}_uploads`;

    for (const file of filesArray) {
      try {
        // Ensure temporary file path exists before creating read stream
        if (!fs.existsSync(file.filepath)) {
          console.error("Temporary file path does not exist:", file.filepath);
          // Skip this file or throw an error for the whole batch?
          // Let's skip and log.
          errors.push(
            `Failed to access temporary file for ${file.originalFilename}`
          );
          continue; // Move to the next file
        }

        const fileStream = fs.createReadStream(file.filepath);
        // Corrected file key generation (unique for each file)
        const fileKey = `uploads/${uuidv4()}-${
          file.originalFilename || "unknownfile"
        }`;

        const uploadParams = {
          Bucket: R2_BUCKET_NAME,
          Key: fileKey,
          Body: fileStream,
          ContentType: file.mimetype || "application/octet-stream",
        };

        console.log(`Uploading ${fileKey} to R2 bucket ${R2_BUCKET_NAME}`);
        const command = new PutObjectCommand(uploadParams);
        await r2Client.send(command);
        console.log(`Successfully uploaded ${fileKey} to R2`);

        // --- Save metadata to Firestore ---
        let firestoreDocId: string | null = null;
        try {
          // --- Find corresponding metadata for this file ---
          const specificMetadata = metadataMap.get(file.originalFilename);

          if (!specificMetadata) {
            // Should not happen if frontend sends correctly, but handle defensively
            console.warn(
              `Metadata not found for file: ${file.originalFilename}. Skipping Firestore save or using defaults.`
            );
            errors.push(`Metadata missing for ${file.originalFilename}`);
            // Option 1: Skip this file's Firestore save
            // continue;
            // Option 2: Use defaults (less ideal here)
            // specificMetadata = { photographer: null, dateTaken: null, location: null, event: null };
            // For now, let's push an error and potentially let it save with nulls/defaults below
            // throw new Error(`Metadata missing for ${file.originalFilename}`); // Or throw to fail faster
          }

          // --- Construct uploadData using specific metadata ---
          const uploadData = {
            r2FileKey: fileKey,
            originalFilename: file.originalFilename || "unknownfile",
            contentType: file.mimetype || "application/octet-stream",
            // Use data from the matched specificMetadata object
            photographer: specificMetadata?.photographer || null,
            // Assuming photographerLink is NOT sent per-file currently
            // photographerLink: specificMetadata?.photographerLink || photographerLink || null, // Example if it was sent
            eventDate: specificMetadata?.dateTaken
              ? new Date(specificMetadata.dateTaken)
              : null,
            location: specificMetadata?.location || null, // Add location
            event: specificMetadata?.event || null,
            category: category, // Global category still used
            uploadedAt: FieldValue.serverTimestamp(),
          };

          // Use the pre-calculated collectionName
          const docRef = await db.collection(collectionName).add(uploadData);
          firestoreDocId = docRef.id;
          console.log(
            `Metadata for ${fileKey} saved to Firestore collection '${collectionName}' with ID: ${firestoreDocId}`
          );

          results.push({
            fileKey: fileKey,
            originalFilename: file.originalFilename,
            firestoreDocId: firestoreDocId,
          });
          successfulUploads++;
        } catch (firestoreError: any) {
          console.error(
            `Error saving metadata to Firestore for ${fileKey}:`,
            firestoreError
          );
          // Decide how to handle Firestore errors for individual files.
          // Maybe delete the R2 object if Firestore fails?
          // For now, just log and add to errors.
          errors.push(
            `Failed to save metadata for ${file.originalFilename}: ${firestoreError.message}`
          );
          // Consider cleanup of R2 object here if needed
        }
        // --- End Firestore Save ---

        // Clean up the temporary file
        fs.unlink(file.filepath, (err) => {
          if (err) {
            console.error("Error deleting temporary file:", file.filepath, err);
            // Log error but don't necessarily fail the whole batch
          }
        });
      } catch (uploadError: any) {
        console.error(
          `Error processing file ${file.originalFilename}:`,
          uploadError
        );
        errors.push(
          `Failed to upload ${file.originalFilename}: ${uploadError.message}`
        );
        // Clean up temp file if it exists, even on error
        if (fs.existsSync(file.filepath)) {
          fs.unlink(file.filepath, (err) => {
            if (err)
              console.error(
                "Error deleting temp file on error:",
                file.filepath,
                err
              );
          });
        }
      }
    } // End loop through filesArray

    // --- Consolidate Response ---
    if (successfulUploads === filesArray.length) {
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
          message: `Processed ${filesArray.length} file(s). Successful: ${successfulUploads}, Failed: ${errors.length}`,
          count: successfulUploads,
          results: results, // Successful ones
          errors: errors, // List of errors
        },
        { status: status }
      );
    }

    /* --- Old single file logic (remove or comment out) ---
    // Ensure temporary file path exists before creating read stream
    if (!fs.existsSync(file.filepath)) {
      // ... old error handling ...
    }
    // ... old R2 upload logic ...
    // ... old Firestore save logic ...
    // ... old temp file cleanup ...
    // ... old single file response ...
    --- */
  } catch (error: any) {
    console.error("Error processing upload request:", error); // General error catch

    // Specific formidable error handling (optional)
    if (error instanceof FormidableErrors.FormidableError) {
      if (error.message.includes("MALFORMED_PART")) {
        return NextResponse.json(
          { error: "Malformed form data.", details: error.message },
          { status: 400 }
        );
      }
      // Add more specific formidable error checks if needed
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
