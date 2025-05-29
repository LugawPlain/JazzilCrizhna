import { initializeApp } from "firebase-admin/app"; // Import specific functions/objects
import { credential, apps } from "firebase-admin"; // Import credential and apps from the main package
import { Auth, getAuth } from "firebase-admin/auth"; // Import specific types and functions
import { Firestore, getFirestore } from "firebase-admin/firestore";
// Restore path and fs imports as they are needed
import path from "path";
import fs from "fs";

// Declare variables outside, initialize to null
let authAdmin: Auth | null = null;
let dbAdmin: Firestore | null = null;
let initError: Error | null = null; // Variable to store initialization error

// Define the fixed path where the build script writes the file (for deployed env)
const fixedCredentialPath = "config/service-account.json";

// Check if already initialized (by checking if dbAdmin is already set)
if (!dbAdmin) {
  try {
    // console.log("[Firebase Admin] Attempting initialization...");

    // Check if Firebase Admin app is already initialized
    if (!apps.length) {
      // Initialize only if no apps exist

      let serviceAccount: object | undefined;
      let initMethod: string | undefined;

      // *** PRIORITY 1: Check for Base64 encoded service account from env variable ***
      if (process.env.FIREBASE_SA_BASE64_CONTENT) {
        try {
          // console.log(
          //   "[Firebase Admin] Attempting to use FIREBASE_SA_BASE64_CONTENT environment variable."
          // );
          const decodedJson = Buffer.from(
            process.env.FIREBASE_SA_BASE64_CONTENT,
            "base64"
          ).toString("utf-8");
          serviceAccount = JSON.parse(decodedJson);
          initMethod = "environment variable (FIREBASE_SA_BASE64_CONTENT)";
        } catch (base64Error: unknown) {
          console.error(
            "[Firebase Admin] Error decoding/parsing FIREBASE_SA_BASE64_CONTENT:",
            base64Error instanceof Error
              ? base64Error.message
              : String(base64Error)
          );
          // Don't re-throw, allow fallback
        }
      }

      // *** PRIORITY 2 (FALLBACK 1): Check for local dev credentials path via GOOGLE_APPLICATION_CREDENTIALS ***
      if (!serviceAccount && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        try {
          const localCredentialPath =
            process.env.GOOGLE_APPLICATION_CREDENTIALS;
          console.warn(
            `[Firebase Admin] Using local credentials path from GOOGLE_APPLICATION_CREDENTIALS: ${localCredentialPath}`
          );

          // Handle relative paths correctly
          const absoluteLocalPath = path.resolve(
            process.cwd(),
            localCredentialPath
          );

          if (fs.existsSync(absoluteLocalPath)) {
            serviceAccount = JSON.parse(
              fs.readFileSync(absoluteLocalPath, "utf8")
            );
            initMethod = `local file path (${localCredentialPath})`;
          } else {
            throw new Error(
              `Local credentials file not found at: ${absoluteLocalPath}. Check GOOGLE_APPLICATION_CREDENTIALS in .env.local.`
            );
          }
        } catch (localError: unknown) {
          console.error(
            "[Firebase Admin] Error initializing from local GOOGLE_APPLICATION_CREDENTIALS path:",
            localError instanceof Error
              ? localError.message
              : String(localError)
          );
          // Don't re-throw, allow fallback to fixed path
        }
      }

      // *** PRIORITY 3 (FALLBACK 2): Check for fixed file path (less ideal for deployment) ***
      if (!serviceAccount) {
        try {
          const absoluteFixedPath = path.resolve(
            process.cwd(),
            fixedCredentialPath
          );
          // console.log(
          //   `[Firebase Admin] Attempting initialization using fixed file path (deployment mode): ${absoluteFixedPath}`
          // );

          if (fs.existsSync(absoluteFixedPath)) {
            serviceAccount = JSON.parse(
              fs.readFileSync(absoluteFixedPath, "utf8")
            );
            initMethod = `fixed build path (${fixedCredentialPath})`;
          } else {
            // Only throw error here if local dev check also failed
            throw new Error(
              `Credentials file not found at fixed path: ${absoluteFixedPath}. Was the build successful?`
            );
          }
        } catch (fixedPathError: unknown) {
          console.error(
            "[Firebase Admin] Error initializing from fixed file path:",
            fixedPathError instanceof Error
              ? fixedPathError.message
              : String(fixedPathError)
          );
          // If we get here, neither local nor fixed path worked
          throw fixedPathError; // Re-throw to halt initialization
        }
      }

      // --- Actual Initialization ---
      if (!serviceAccount || !initMethod) {
        // This should theoretically not be reached if the logic above is correct
        throw new Error(
          "Could not determine valid Firebase credentials source."
        );
      }

      // console.log(
      //   `[Firebase Admin] Using credentials from: ${initMethod}. Project ID: ${
      //     (serviceAccount as any).project_id || "undefined"
      //   }`
      // );

      initializeApp({
        credential: credential.cert(serviceAccount),
      });

      //   console.log("[Firebase Admin] Initialized successfully.");
    } else {
      //   console.log("[Firebase Admin] Using existing Firebase Admin app.");
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

    // console.log(
    //   "[Firebase Admin] Auth and Firestore services obtained successfully."
    // );
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
