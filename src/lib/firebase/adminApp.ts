import * as admin from "firebase-admin";
import { Auth } from "firebase-admin/auth"; // Import specific types
import { Firestore } from "firebase-admin/firestore";

// Declare variables outside, initialize to null
let authAdmin: Auth | null = null;
let dbAdmin: Firestore | null = null;
let initError: Error | null = null; // Variable to store initialization error

// Check if already initialized (by checking if dbAdmin is already set)
if (!dbAdmin) {
  try {
    console.log("[Firebase Admin] Attempting initialization...");
    if (!admin.apps.length) {
      // Initialize only if no apps exist
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

      if (serviceAccountJson) {
        const serviceAccount = JSON.parse(serviceAccountJson);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log(
          "[Firebase Admin] Initialized using FIREBASE_SERVICE_ACCOUNT_JSON."
        );
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        admin.initializeApp();
        console.log(
          "[Firebase Admin] Initialized using GOOGLE_APPLICATION_CREDENTIALS."
        );
      } else {
        throw new Error(
          "Missing Firebase Admin credentials (set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON)."
        );
      }
    } else {
      console.log("[Firebase Admin] Using existing Firebase Admin app.");
    }

    // --- Get services ONLY AFTER successful initialization/app check ---
    authAdmin = admin.auth();
    dbAdmin = admin.firestore();
    console.log("[Firebase Admin] Auth and Firestore services obtained.");
  } catch (error: any) {
    initError = error; // Store the initialization error
    console.error(
      "[Firebase Admin] CRITICAL INITIALIZATION ERROR:",
      error.message
    );
    // Keep authAdmin and dbAdmin as null
  }
}

// Export the potentially null services
// API routes MUST check if dbAdmin is null before using it.
export { authAdmin, dbAdmin, initError };
