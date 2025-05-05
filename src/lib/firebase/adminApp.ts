import { initializeApp } from "firebase-admin/app"; // Import specific functions/objects
import { credential, apps } from "firebase-admin"; // Import credential and apps from the main package
import { Auth, getAuth } from "firebase-admin/auth"; // Import specific types and functions
import { Firestore, getFirestore } from "firebase-admin/firestore";
// Restore path and fs imports as they are needed for the fallback logic
import path from "path";
import fs from "fs";

// Declare variables outside, initialize to null
let authAdmin: Auth | null = null;
let dbAdmin: Firestore | null = null;
let initError: Error | null = null; // Variable to store initialization error

// Check if already initialized (by checking if dbAdmin is already set)
if (!dbAdmin) {
  try {
    console.log("[Firebase Admin] Attempting initialization...");

    // Check if Firebase Admin app is already initialized
    if (!apps.length) {
      // Initialize only if no apps exist

      // *** NEW: Prioritize Base64 encoded credentials ***
      if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
        try {
          console.log(
            "[Firebase Admin] Attempting initialization using Base64 encoded credentials."
          );
          const base64Credentials = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
          const decodedJsonString = Buffer.from(
            base64Credentials,
            "base64"
          ).toString("utf-8");
          const serviceAccount = JSON.parse(decodedJsonString);

          console.log(
            `[Firebase Admin] Successfully decoded Base64. Project ID: ${
              serviceAccount.project_id || "undefined"
            }`
          );

          initializeApp({
            credential: credential.cert(serviceAccount),
          });

          console.log(
            "[Firebase Admin] Initialized successfully using Base64 credentials."
          );
        } catch (base64Error: unknown) {
          const errorMessage =
            base64Error instanceof Error
              ? base64Error.message
              : String(base64Error);
          console.error(
            "[Firebase Admin] Error initializing from Base64 credentials:",
            errorMessage
          );
          // Add more context if possible
          if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64.length > 4000) {
            console.warn(
              "[Firebase Admin] Base64 credential string might be too large (>4KB)."
            );
          }
          throw new Error(
            `Failed to initialize from Base64 credentials: ${errorMessage}`
          );
        }
      }
      // *** FALLBACK: Keep GOOGLE_APPLICATION_CREDENTIALS (as file path) for local/alternative setups ***
      else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // --- Keep the existing file path logic as a fallback ---
        let credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        // This block should only be relevant for local dev or specific non-Netlify setups now
        console.warn(
          "[Firebase Admin] Using GOOGLE_APPLICATION_CREDENTIALS (file path) - Ensure this is intended for the environment."
        );

        // Check if it's a relative path (less likely needed now, but kept for compatibility)
        if (
          credentialPath.startsWith("./") ||
          credentialPath.startsWith("../")
        ) {
          // Use the imported 'path' module directly
          const absolutePath = path.resolve(process.cwd(), credentialPath);
          console.log(
            `[Firebase Admin] Converting relative path to absolute: ${absolutePath}`
          );
          credentialPath = absolutePath;
        }

        console.log(
          `[Firebase Admin] Using credentials file path: ${credentialPath}`
        );

        try {
          // Use the imported 'fs' module directly
          if (fs.existsSync(credentialPath)) {
            const serviceAccountJson = JSON.parse(
              fs.readFileSync(credentialPath, "utf8")
            );
            console.log(
              `[Firebase Admin] Parsed service account file. Project ID: ${serviceAccountJson.project_id}`
            );
            initializeApp({
              credential: credential.cert(serviceAccountJson),
            });
            console.log(
              "[Firebase Admin] Initialized with service account from file path."
            );
          } else {
            throw new Error(
              `Credentials file not found at path: ${credentialPath}`
            );
          }
        } catch (fileError: unknown) {
          console.error(
            "[Firebase Admin] Error during file path initialization:",
            fileError instanceof Error ? fileError.message : String(fileError)
          );
          throw fileError; // Re-throw
        }
        // --- End of file path fallback logic ---
      }
      // *** REMOVE or comment out the direct JSON string logic if not needed ***
      // else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) { ... }
      else {
        // If neither Base64 nor file path is provided
        throw new Error(
          "Missing Firebase Admin credentials. Set FIREBASE_SERVICE_ACCOUNT_BASE64 (recommended for Netlify) or GOOGLE_APPLICATION_CREDENTIALS (file path for local/other)."
        );
      }
    } else {
      console.log("[Firebase Admin] Using existing Firebase Admin app.");
    }

    // --- Get services ONLY AFTER successful initialization/app check ---
    authAdmin = getAuth(); // Use directly imported function
    dbAdmin = getFirestore(); // Use directly imported function

    // Verify services are available
    if (!authAdmin || !dbAdmin) {
      throw new Error(
        "Failed to obtain Auth or Firestore services after initialization"
      );
    }

    console.log(
      "[Firebase Admin] Auth and Firestore services obtained successfully."
    );
  } catch (error: unknown) {
    initError = error instanceof Error ? error : new Error(String(error)); // Store the initialization error
    console.error(
      "[Firebase Admin] CRITICAL INITIALIZATION ERROR:",
      initError.message,
      initError.stack // Log stack trace for better debugging
    );
    // Keep authAdmin and dbAdmin as null
  }
}

// Export the potentially null services
// API routes MUST check if dbAdmin is null before using it.
export { authAdmin, dbAdmin, initError };
