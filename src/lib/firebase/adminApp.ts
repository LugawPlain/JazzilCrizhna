import * as admin from "firebase-admin";

// Option 1: Use GOOGLE_APPLICATION_CREDENTIALS environment variable (Recommended)
// If the GOOGLE_APPLICATION_CREDENTIALS environment variable is set,
// initializeApp() will automatically use it.

// Option 2: Use a specific environment variable for the service account JSON contents
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

// Option 3: Use a direct path (Less secure for local dev, ensure it's in .gitignore)
// const serviceAccountPath = './path/to/your-service-account-key.json';

let initialized = admin.apps.length > 0;

if (!initialized) {
  try {
    if (serviceAccountJson) {
      // Option 2 implementation
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        // databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com` // Optional: If using Realtime DB
      });
      console.log(
        "Firebase Admin SDK initialized using FIREBASE_SERVICE_ACCOUNT_JSON."
      );
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Option 1 implementation (or default if GOOGLE_APPLICATION_CREDENTIALS is set)
      admin.initializeApp();
      console.log(
        "Firebase Admin SDK initialized using GOOGLE_APPLICATION_CREDENTIALS."
      );
    }
    // else if (serviceAccountPath) {
    //   // Option 3 implementation
    //   const serviceAccount = require(serviceAccountPath);
    //   admin.initializeApp({
    //     credential: admin.credential.cert(serviceAccount)
    //   });
    //   console.log('Firebase Admin SDK initialized using service account file path.');
    // }
    else {
      console.warn(
        "Firebase Admin SDK not initialized. Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON environment variables."
      );
    }
    initialized = true;
  } catch (error: any) {
    console.error("Firebase Admin SDK initialization error:", error.message);
    // Prevent further attempts if initialization fails critically
    // initialized = true;
  }
}

const authAdmin = admin.auth();
const dbAdmin = admin.firestore(); // Example: If using Firestore Admin
// const storageAdmin = admin.storage(); // Example: If using Storage Admin

export { authAdmin, dbAdmin }; // Export necessary admin modules
