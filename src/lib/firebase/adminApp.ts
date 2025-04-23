import { initializeApp } from "firebase-admin/app"; // Import specific functions/objects
import { credential, apps } from "firebase-admin"; // Import credential and apps from the main package
import { Auth, getAuth } from "firebase-admin/auth"; // Import specific types and functions
import { Firestore, getFirestore } from "firebase-admin/firestore";
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

      // Prioritize GOOGLE_APPLICATION_CREDENTIALS since it's working for the user
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // Handle relative paths by converting to absolute paths
        let credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

        // Check if it's a relative path
        if (
          credentialPath.startsWith("./") ||
          credentialPath.startsWith("../")
        ) {
          const absolutePath = path.resolve(process.cwd(), credentialPath);
          console.log(
            `[Firebase Admin] Converting relative path to absolute: ${absolutePath}`
          );
          credentialPath = absolutePath;
        }

        // Log the path for debugging
        console.log(
          `[Firebase Admin] Using credentials file at: ${credentialPath}`
        );

        try {
          // CHANGE: Read the service account file directly and use it
          if (fs.existsSync(credentialPath)) {
            const serviceAccountJson = JSON.parse(
              fs.readFileSync(credentialPath, "utf8")
            );

            // Add logging for parsed project_id
            console.log(
              `[Firebase Admin] Parsed service account JSON. Project ID: ${serviceAccountJson.project_id}`
            );

            // Initialize with explicit credentials
            initializeApp({
              // Use directly imported function
              credential: credential.cert(serviceAccountJson), // Use directly imported object/function
            });
            console.log(
              "[Firebase Admin] Initialized with service account from file."
            );
          } else {
            throw new Error(`Credentials file not found at: ${credentialPath}`);
          }
        } catch (initError: unknown) {
          console.error(
            "[Firebase Admin] Error during initialization:",
            initError instanceof Error ? initError.message : String(initError)
          );
          throw initError;
        }
      } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        // Only try this if GOOGLE_APPLICATION_CREDENTIALS is not available
        try {
          // Check if the JSON string contains a file path (starts with ./ or /)
          const jsonValue = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
          if (jsonValue.startsWith("./") || jsonValue.startsWith("/")) {
            throw new Error(
              "FIREBASE_SERVICE_ACCOUNT_JSON appears to contain a file path instead of JSON content"
            );
          }

          // Parse service account JSON and log some non-sensitive details for debugging
          const serviceAccount = JSON.parse(jsonValue);
          console.log(
            `[Firebase Admin] Service account found with project_id: ${
              serviceAccount.project_id || "undefined"
            }`
          );

          initializeApp({
            // Use directly imported function
            credential: credential.cert(serviceAccount), // Use directly imported object/function
          });
          console.log(
            "[Firebase Admin] Initialized using FIREBASE_SERVICE_ACCOUNT_JSON."
          );
        } catch (jsonError: unknown) {
          throw new Error(
            `Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON: ${
              jsonError instanceof Error ? jsonError.message : String(jsonError)
            }`
          );
        }
      } else {
        throw new Error(
          "Missing Firebase Admin credentials (set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON)."
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
      initError.stack
    );
    // Keep authAdmin and dbAdmin as null
  }
}

// Export the potentially null services
// API routes MUST check if dbAdmin is null before using it.
export { authAdmin, dbAdmin, initError };
