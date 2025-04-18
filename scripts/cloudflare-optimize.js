/**
 * Cloudflare Pages Optimization Script
 *
 * This script helps clean up and optimize the project for Cloudflare Pages
 * by removing unnecessary files and dependencies.
 */

import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

// Files to remove
const filesToRemove = ["netlify.toml"];

// Clean up files
console.log("🧹 Cleaning up files...");
filesToRemove.forEach((file) => {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`✅ Removed ${file}`);
  } else {
    console.log(`⏭️ File ${file} does not exist, skipping`);
  }
});

// Verify LFS setup
console.log("🔍 Checking Git LFS setup...");
exec("git lfs status", (error, stdout, stderr) => {
  if (error) {
    console.error("❌ Git LFS is not set up correctly");
    console.log("Please run:");
    console.log("  git lfs install");
    console.log('  git lfs track "*.webp"');
  } else {
    console.log("✅ Git LFS is set up correctly");
  }
});

// Create necessary directories
console.log("📁 Creating directories...");
const dirsToCreate = [
  path.join(rootDir, "functions"),
  path.join(rootDir, ".cloudflare"),
];

dirsToCreate.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created ${dir}`);
  } else {
    console.log(`⏭️ Directory ${dir} already exists, skipping`);
  }
});

console.log("\n✨ Cloudflare optimization complete!");
console.log("\nNext steps:");
console.log("1. Install wrangler: npm install -g wrangler");
console.log("2. Login to Cloudflare: wrangler login");
console.log("3. Build your project: npm run build");
console.log("4. Deploy to Cloudflare: npm run cloudflare:deploy");
