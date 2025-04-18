import React from "react";
import CategoryPageContent from "@/components/CategoryPageContent";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  return <CategoryPageContent category={category} />;
}
