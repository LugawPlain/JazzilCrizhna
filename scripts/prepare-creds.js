const fs = require("fs");
const path = require("path");

// Env variable holding the base64 content (set in Netlify UI)
const base64Creds = process.env.FIREBASE_SA_BASE64_CONTENT;
// Define where the decoded file will be written (relative to project root)
const targetDir = path.resolve(__dirname, "../config");
const targetPath = path.join(targetDir, "service-account.json");

console.log("[prepare-creds] Starting script...");

if (!base64Creds) {
  console.error(
    "ERROR: FIREBASE_SA_BASE64_CONTENT build environment variable not set!"
  );
  process.exit(1); // Fail the build
}

try {
  // Decode the base64 string
  const decodedJson = Buffer.from(base64Creds, "base64").toString("utf-8");

  // Ensure the target directory exists
  if (!fs.existsSync(targetDir)) {
    console.log(`[prepare-creds] Creating directory: ${targetDir}`);
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Write the decoded JSON to the target file path
  fs.writeFileSync(targetPath, decodedJson);
  console.log(
    `[prepare-creds] Successfully wrote service account JSON to ${targetPath}`
  );
} catch (err) {
  console.error("[prepare-creds] Error preparing credentials file:", err);
  process.exit(1); // Fail the build
}
