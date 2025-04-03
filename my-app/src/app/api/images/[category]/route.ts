import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  request: Request,
  context: { params: { category: string } }
) {
  try {
    const { category } = context.params;
    if (!category) {
      return NextResponse.json(
        { error: "Category parameter is missing" },
        { status: 400 }
      );
    }

    const publicPath = path.join(process.cwd(), "public", category);

    // Check if the directory exists
    if (!fs.existsSync(publicPath)) {
      return NextResponse.json({ images: [] }, { status: 200 });
    }

    // Read the directory and filter for image files
    const files = fs.readdirSync(publicPath);
    const imageFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return [".jpg", ".jpeg", ".png", ".webp"].includes(ext);
    });

    return NextResponse.json({ images: imageFiles });
  } catch (error) {
    console.error("Error reading images:", error);
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 }
    );
  }
}
