import { NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase/adminApp"; // Adjust path if needed

// Define the structure to match CategoryData/ProjectCard needs
interface ProjectCardData {
  category: string;
  imageSrc: string; // Renamed from image for clarity
  title?: string; // Make optional if not always present
  link?: string; // Likely the portfolio link derived from category
  photographer?: string | null;
  photographerLink?: string | null; // Renamed for consistency
  // Add any other fields ProjectCard might display if available in Firestore
}

export async function GET() {
  const endpoint = "/api/fetch-project-images";
  const logPrefix = `[${endpoint}]`;

  if (!dbAdmin) {
    console.error(`${logPrefix} Firestore instance (dbAdmin) not available.`);
    return NextResponse.json(
      { error: "Server configuration error (Database not ready)." },
      { status: 500 }
    );
  }
  console.log(`${logPrefix} GET request received.`);

  try {
    const collectionName = "portfolio_uploads";
    console.log(
      `${logPrefix} Querying '${collectionName}' for documents where isProjectImage is true.`
    );

    const projectImagesSnapshot = await dbAdmin
      .collection(collectionName)
      .where("isProjectImage", "==", true)
      .get();

    if (projectImagesSnapshot.empty) {
      console.log(
        `${logPrefix} No documents found with isProjectImage = true.`
      );
      return NextResponse.json({ projectImages: [] }, { status: 200 });
    }

    console.log(
      `${logPrefix} Found ${projectImagesSnapshot.size} document(s) marked as project images.`
    );

    const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_SUB_URL || "";
    if (!r2PublicUrl) {
      console.warn(
        `${logPrefix} NEXT_PUBLIC_R2_PUBLIC_SUB_URL is not set. Image URLs might be incomplete.`
      );
    }

    const projectImages: ProjectCardData[] = projectImagesSnapshot.docs.map(
      (doc) => {
        const data = doc.data();
        const category = data.category || "unknown";
        const imageSrc =
          r2PublicUrl && data.r2FileKey
            ? `${r2PublicUrl}/${data.r2FileKey}`
            : "/placeholder.jpg";

        console.log(
          `${logPrefix} Mapping doc ID ${doc.id}: Category='${category}', Key='${data.r2FileKey}', Src='${imageSrc}'`
        );

        return {
          category: category,
          imageSrc: imageSrc,
          title: data.title || category,
          link: `/portfolio/${category.toLowerCase()}`,
          photographer: data.photographer || null,
          photographerLink: data.photographerLink || null,
        };
      }
    );

    projectImages.sort((a, b) => a.category.localeCompare(b.category));
    console.log(
      `${logPrefix} Returning ${projectImages.length} sorted project image items.`
    );

    return NextResponse.json({ projectImages }, { status: 200 });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    console.error(`${logPrefix} Error fetching project images:`, error);
    return NextResponse.json(
      { error: "Failed to fetch project images", details: errorMessage },
      { status: 500 }
    );
  }
}

// Optional: Add OPTIONS handler if needed
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*", // Adjust as needed
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
