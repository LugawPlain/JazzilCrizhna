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

    // Read the images-data.json file
    const imagesDataPath = path.join(process.cwd(), "public/images-data.json");
    const imagesData = JSON.parse(fs.readFileSync(imagesDataPath, "utf-8"));

    // Get the category data from images-data.json
    const categoryData = imagesData[categoryLower];
    console.log(categoryData);
    if (!categoryData) {
      console.log(`No data found for category: ${category}`);
      return NextResponse.json({ images: [], imageData: {} }, { status: 200 });
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
      console.log(`No matching directory found for category: ${category}`);
      return NextResponse.json(
        { images: [], imageData: categoryData },
        { status: 200 }
      );
    }

    const publicPath = path.join(categoriesPath, matchingDir);

    // Read the directory and filter for image files
    const files = fs.readdirSync(publicPath);
    const imageFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return [".webp"].includes(ext);
    });

    // Sort the image files numerically
    imageFiles.sort((a, b) => {
      const numA = parseInt(a.replace(".webp", ""));
      const numB = parseInt(b.replace(".webp", ""));
      return numA - numB;
    });

    return NextResponse.json(
      {
        images: imageFiles,
        imageData: categoryData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error reading images:", error);
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 }
    );
  }
}
