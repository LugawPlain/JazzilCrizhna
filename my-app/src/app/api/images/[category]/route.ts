import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const { category } = await params;
    if (!category) {
      return NextResponse.json(
        { error: "Category parameter is missing" },
        { status: 400 }
      );
    }

    // Convert category to lowercase for case-insensitive matching
    const categoryLower = category.toLowerCase();

    // Check if the directory exists in public/categories
    const categoriesPath = path.join(process.cwd(), "public/categories");
    console.log("categoriesPath: " + categoriesPath);
    const categoryDirs = fs.existsSync(categoriesPath)
      ? fs
          .readdirSync(categoriesPath)
          .filter((item) =>
            fs.statSync(path.join(categoriesPath, item)).isDirectory()
          )
      : [];

    console.log("categoryDirs: " + categoryDirs);
    // Find the matching directory (case-insensitive)
    const matchingDir = categoryDirs.find(
      (dir) => dir.toLowerCase() === categoryLower
    );
    console.log("matchingDir: " + matchingDir);

    if (!matchingDir) {
      console.log(`No matching directory found for category: ${category}`);
      return NextResponse.json({ images: [] }, { status: 200 });
    }

    const publicPath = path.join(categoriesPath, matchingDir);
    console.log("publicPath: " + publicPath);

    // Check if the directory exist

    // Read the directory and filter for image files
    const files = fs.readdirSync(publicPath);
    const imageFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return [".jpg", ".jpeg", ".png", ".webp, .heic"].includes(ext);
    });

    return NextResponse.json({ images: imageFiles }, { status: 200 });
  } catch (error) {
    console.error("Error reading images:", error);
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 }
    );
  }
}
