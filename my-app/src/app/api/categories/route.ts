// import { NextResponse } from "next/server";
// import fs from "fs";
// import path from "path";

// export async function GET() {
//   try {
//     // Read the public directory to get all category folders
//     const publicCategoryDir = path.join(process.cwd(), "public/categories");
//     const categories = fs
//       .readdirSync(publicCategoryDir)
//       .filter((item) => {
//         const itemPath = path.join(publicCategoryDir, item);
//         return (
//           fs.statSync(itemPath).isDirectory() &&
//           !item.startsWith("_") && // Exclude Next.js special folders
//           item !== "api"
//         ); // Exclude API folder
//       })
//       .map((category) => ({
//         category,
//         path: `/portfolio/${category.toLowerCase()}`,
//         description: `${category} Portfolio`, // You can customize this or fetch from a database
//       }));

//     return NextResponse.json({ categories });
//   } catch (error) {
//     console.error("Error fetching categories:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch categories" },
//       { status: 500 }
//     );
//   }
// }
