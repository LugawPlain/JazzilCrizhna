// This file helps configure Cloudflare Pages specific build settings
// It will be used during deployment to handle large files

module.exports = {
  // Configure which files should be included in the build
  includeFiles: [
    // Include only necessary files
    ".next/**/*",
    "public/**/*.json",
    "public/**/*.ico",
    "public/**/*.svg",
    "!public/**/*.webp", // Exclude webp files from direct deployment
  ],

  // Configure build settings
  build: {
    base: "./",
    command: "npm run build",
    output: ".next",
  },

  // Configure routes
  routes: [
    // Serve images directly from LFS
    {
      pattern: "\\.(webp|jpg|jpeg|png|gif)$",
      headers: {
        "Cache-Control": "public, max-age=604800, immutable",
      },
      redirect: {
        type: "external",
      },
    },
    // Handle all other routes with Next.js
    {
      pattern: ".*",
      dest: "/.next/server/pages/$1",
    },
  ],
};
