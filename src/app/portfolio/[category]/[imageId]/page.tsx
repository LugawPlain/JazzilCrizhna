import React from "react";

// TODO: Implement actual component logic to display the image based on category and imageId

// This function defines the possible paths that should be generated at build time.
export async function generateStaticParams() {
  // TODO: Replace this with your actual data fetching logic
  // 1. Fetch all categories
  const categories = ["Muse", "PhotoShoot"]; // Replace with actual categories

  // 2. For each category, fetch its image IDs
  const paths = await Promise.all(
    categories.map(async (category) => {
      // Example: Fetch image IDs for the current category
      let imageIds: string[] = []; // Explicitly type imageIds
      if (category === "Muse") {
        imageIds = ["muse-image-1", "muse-image-2"]; // Replace with actual image IDs
      } else if (category === "PhotoShoot") {
        imageIds = ["photoshoot-image-1", "photoshoot-image-2"]; // Replace with actual image IDs
      }

      return imageIds.map((imageId) => ({
        category: category,
        imageId: imageId,
      }));
    })
  );

  // Flatten the array of arrays into a single array of paths
  return paths.flat();
}

// Component to render the specific image page
// It receives category and imageId from the URL params
const ImageDetailPage = ({
  params,
}: {
  params: { category: string; imageId: string };
}) => {
  const { category, imageId } = params;

  // TODO: Add logic here to display the specific image
  // You might fetch image details using category and imageId

  return (
    <div>
      <h1>Category: {category}</h1>
      <h2>Image ID: {imageId}</h2>
      {/* Placeholder for image display */}
    </div>
  );
};

export default ImageDetailPage;
