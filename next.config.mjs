/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",

  // Required for static export with next/image, remove if not using next/image
  images: {
    unoptimized: true,
  },

  // Add other Next.js configurations here if needed
};

export default nextConfig;
