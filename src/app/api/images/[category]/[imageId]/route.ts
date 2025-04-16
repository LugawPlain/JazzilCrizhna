import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ category: string; imageId: string }> }
) {
  try {
    const { category, imageId } = await params;
    if (!category || !imageId) {
      return NextResponse.json(
        { error: "Category or imageId parameter is missing" },
        { status: 400 }
      );
    }

    // Convert category to lowercase for case-insensitive matching
    const categoryLower = category.toLowerCase();

    // Read the images-data.json file
    const imagesDataPath = path.join(process.cwd(), "public/images-data.json");
    const imagesData = JSON.parse(fs.readFileSync(imagesDataPath, "utf-8"));

    // Get the category data from images-data.json
    const categoryData = imagesData[categoryLower];

    if (!categoryData) {
      return NextResponse.json(
        { error: `No data found for category: ${category}` },
        { status: 404 }
      );
    }

    // Get the image data
    const imageData = categoryData[imageId];

    if (!imageData) {
      return NextResponse.json(
        { error: `Image with ID ${imageId} not found in category ${category}` },
        { status: 404 }
      );
    }

    // Check if the directory exists in public/categories
    const categoriesPath = path.join(process.cwd(), "public/categories");
    const categoryDirs = fs.existsSync(categoriesPath)
      ? fs
          .readdirSync(categoriesPath)
          .filter((item) =>
            fs.statSync(path.join(categoriesPath, item)).isDirectory()
          )
      : [];

    // Find the matching directory (case-insensitive)
    const matchingDir = categoryDirs.find(
      (dir) => dir.toLowerCase() === categoryLower
    );

    if (!matchingDir) {
      return NextResponse.json(
        { error: `No matching directory found for category: ${category}` },
        { status: 404 }
      );
    }

    // Add the proper file path and category name
    return NextResponse.json(
      {
        ...imageData,
        category: matchingDir,
        fullImagePath: `/categories/${matchingDir}/${imageData.filename}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching image data:", error);
    return NextResponse.json(
      { error: "Failed to fetch image data" },
      { status: 500 }
    );
  }
}
