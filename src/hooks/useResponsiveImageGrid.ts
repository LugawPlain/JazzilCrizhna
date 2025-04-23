import { useState, useEffect } from "react";
import { ImageData } from "@/hooks/useImages"; // Assuming ImageData is exported from useImages

// Function to determine columns based on width
const getColumnsFromWidth = (width: number): number => {
  if (width < 640) return 1;
  if (width < 768) return 2;
  if (width < 1024) return 3;
  if (width < 1280) return 4;
  return 5;
};

// Function to distribute images into columns
const distributeImages = (
  images: ImageData[],
  numColumns: number
): ImageData[][] => {
  const columns = Array.from({ length: numColumns }, () => [] as ImageData[]);
  images.forEach((image, index) => {
    if (numColumns > 0) {
      const columnIndex = index % numColumns;
      columns[columnIndex].push(image);
    }
  });
  return columns;
};

export const useResponsiveImageGrid = (
  images: ImageData[],
  userColumnCount: number | null,
  loading: boolean
) => {
  const [activeLayout, setActiveLayout] = useState<ImageData[][]>([]);
  const [activeColumnCount, setActiveColumnCount] = useState(1);

  // Effect to update layout based on window size, user preference, images, and loading state
  useEffect(() => {
    const updateLayout = () => {
      let columnsToUse: number;

      if (userColumnCount) {
        columnsToUse = userColumnCount;
      } else {
        columnsToUse = getColumnsFromWidth(window.innerWidth);
      }

      // Ensure columnsToUse is at least 1, even if images are empty
      columnsToUse = Math.max(1, columnsToUse);

      setActiveColumnCount(columnsToUse);
      // Only distribute images if there are images and columns
      if (images.length > 0 && columnsToUse > 0) {
        setActiveLayout(distributeImages(images, columnsToUse));
      } else {
        setActiveLayout(Array.from({ length: columnsToUse }, () => [])); // Ensure empty columns array if no images
      }
    };

    if (!loading) {
      updateLayout(); // Initial layout calculation
      window.addEventListener("resize", updateLayout);
      return () => window.removeEventListener("resize", updateLayout);
    } else {
      // Optionally reset layout when loading starts
      setActiveLayout([]);
      setActiveColumnCount(1); // Reset to default or calculated minimum
    }
  }, [userColumnCount, images, loading]); // Recalculate when these change

  return { activeLayout, activeColumnCount };
};
