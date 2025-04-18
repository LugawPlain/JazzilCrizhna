import React from "react";
import CategoryPageContent from "@/components/CategoryPageContent";

// This function defines the possible paths that should be generated at build time.
export async function generateStaticParams() {
  // TODO: Replace this with your actual data fetching logic
  // Example: Fetch categories from an API or database
  const categories = ["Muse", "PhotoShoot"]; // Replace with actual categories

  return categories.map((category) => ({
    category: category,
  }));
}

export default async function CategoryPage({
  params,
}: {
  params: { category: string }; // Corrected the type here, params is not a Promise in this context
}) {
  const { category } = params; // Removed await, params is directly available
  return <CategoryPageContent category={category} />;
}
