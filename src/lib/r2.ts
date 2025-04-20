// lib/r2.js (or utils/r2Client.js)
import { S3Client } from "@aws-sdk/client-s3";

const R2_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  // In production, you might want to throw an error or handle this differently
  console.warn("R2 environment variables are not fully set.");
  // Avoid creating the client if variables are missing in production
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Missing Cloudflare R2 credentials in environment variables."
    );
  }
}

// Construct the R2 endpoint URL
const r2Endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

// Initialize the S3 client configured for R2
// Important: Set region to 'auto'
export const r2Client = new S3Client({
  region: "auto",
  endpoint: r2Endpoint,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || "dummy_access_key_id", // Provide dummy values if needed for non-prod environments where vars might be missing
    secretAccessKey: R2_SECRET_ACCESS_KEY || "dummy_secret_access_key",
  },
});

export const R2_BUCKET_NAME =
  process.env.R2_BUCKET_NAME || "your-default-bucket-name";
// export const R2_PUBLIC_BUCKET_URL = process.env.R2_PUBLIC_BUCKET_URL; // Optional
