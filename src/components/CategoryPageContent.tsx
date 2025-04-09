"use client";
import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SettingsPanel from "@/app/components/SettingsPanel";
import FullscreenViewer from "@/components/FullscreenViewer";
import ImageCard from "@/components/ImageCard";

interface ImageData {
  src: string;
  alt: string;
  date: string;
  photographer: string;
  photographerLink: string;
  location: string;
  event: string;
}

interface CategoryPageContentProps {
  category: string;
}

/**
 * Checks if fullscreen API is supported in the current browser
 * @returns boolean indicating if fullscreen is supported
 */
const isFullscreenSupported = (): boolean => {
  return !!(
    document.fullscreenEnabled ||
    (document as Document & { webkitFullscreenEnabled?: boolean })
      .webkitFullscreenEnabled ||
    (document as Document & { mozFullScreenEnabled?: boolean })
      .mozFullScreenEnabled ||
    (document as Document & { msFullscreenEnabled?: boolean })
      .msFullscreenEnabled
  );
};

const CategoryPageContent: React.FC<CategoryPageContentProps> = ({
  category,
}) => {
  // State management
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [userColumnCount, setUserColumnCount] = useState<number | null>(null);
  const [activeLayout, setActiveLayout] = useState<ImageData[][]>([]);
  const [activeColumnCount, setActiveColumnCount] = useState(1);

  // Function to capitalize first letter - memoized
  const capitalizeFirstLetter = useCallback((string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }, []);

  // Fetch images on component mount
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch(`/api/images/${category}`);
        const data = await response.json();

        // Pre-fetch images for better performance
        const preloadImages = async (imageUrls: string[]) => {
          // Create a queue to load images in batches to avoid overwhelming the browser
          const batchSize = 3;
          const batches = [];

          for (let i = 0; i < imageUrls.length; i += batchSize) {
            batches.push(imageUrls.slice(i, i + batchSize));
          }

          // Process batches sequentially
          for (const batch of batches) {
            const promises = batch.map((url) => {
              return new Promise<void>((resolve) => {
                const img = new window.Image();
                img.src = url;
                img.onload = () => resolve();
                img.onerror = () => resolve(); // Resolve even on error to not block other images
              });
            });

            // Wait for the current batch to complete before moving to the next
            await Promise.all(promises);
          }
        };

        const formattedImages = data.images.map(
          (img: string, index: number) => {
            // Get the image number from the filename (e.g., "1.webp" -> "1")
            const imageNumber = img.replace(".webp", "");

            return {
              src: `/categories/${data.imageData.category || category}/${img}`,
              alt:
                data.imageData?.[imageNumber]?.alt ||
                `${category} image ${index + 1}`,
              date:
                data.imageData?.[imageNumber]?.date ||
                new Date(2024, 2, 15 + index).toISOString().split("T")[0],
              photographer:
                data.imageData?.[imageNumber]?.photographer ||
                `Photographer ${index + 1}`,
              photographerLink:
                data.imageData?.[imageNumber]?.photographerLink || `#`,
              location:
                data.imageData?.[imageNumber]?.location ||
                `Location ${index + 1}`,
              event:
                data.imageData?.[imageNumber]?.event || `Event ${index + 1}`,
            };
          }
        );

        // Sort images by date in descending order, handling both available and fallback dates
        const sortedImages = formattedImages.sort(
          (a: ImageData, b: ImageData) => {
            // Convert dates to timestamps, using 0 for empty dates
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;

            // If both dates are available or both are fallback, sort normally
            if ((dateA && dateB) || (!dateA && !dateB)) {
              return dateB - dateA;
            }

            // If one is available and one is fallback, prioritize the available date
            return dateB - dateA;
          }
        );

        setImages(sortedImages);

        // Start preloading images in the background
        preloadImages(sortedImages.map((img: ImageData) => img.src));
      } catch (error: unknown) {
        console.error("Error fetching images:", error);
      } finally {
        setLoading(false);
      }
    };

    if (category) {
      fetchImages();
    }
  }, [category]);

  // Event handlers
  const handleClose = useCallback(() => {
    setSelectedImage(null);
    setCurrentIndex(0);

    // Check if the document is actually in fullscreen mode
    const isActuallyFullscreen = !!(
      document.fullscreenElement ||
      (document as Document & { webkitFullscreenElement?: Element })
        .webkitFullscreenElement ||
      (document as Document & { mozFullScreenElement?: Element })
        .mozFullScreenElement ||
      (document as Document & { msFullscreenElement?: Element })
        .msFullscreenElement
    );

    if (isFullscreen && isActuallyFullscreen) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err: Error) => {
          console.error("Error exiting fullscreen:", err);
        });
      } else {
        const webkitExitFullscreen = (
          document as Document & { webkitExitFullscreen?: () => Promise<void> }
        ).webkitExitFullscreen;
        const mozCancelFullScreen = (
          document as Document & { mozCancelFullScreen?: () => Promise<void> }
        ).mozCancelFullScreen;
        const msExitFullscreen = (
          document as Document & { msExitFullscreen?: () => Promise<void> }
        ).msExitFullscreen;

        if (webkitExitFullscreen) {
          webkitExitFullscreen();
        } else if (mozCancelFullScreen) {
          mozCancelFullScreen();
        } else if (msExitFullscreen) {
          msExitFullscreen();
        }
      }
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  const handleNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setSelectedImage(images[newIndex]);
    }
  }, [currentIndex, images]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setSelectedImage(images[newIndex]);
    }
  }, [currentIndex, images]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      } else if (e.key === "ArrowRight" && selectedImage) {
        handleNext();
      } else if (e.key === "ArrowLeft" && selectedImage) {
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose, handleNext, handlePrev, selectedImage]);

  // Image click handler
  const handleImageClick = useCallback(
    async (image: ImageData, index: number) => {
      setSelectedImage(image);
      setCurrentIndex(index);
      try {
        // Check if fullscreen is supported and not already in fullscreen mode
        if (!isFullscreen && isFullscreenSupported()) {
          await document.documentElement.requestFullscreen();
          setIsFullscreen(true);
        }
      } catch (err: unknown) {
        console.error("Error entering fullscreen:", err);
        // Continue showing the image even if fullscreen fails
        setIsFullscreen(false);
      }
    },
    [isFullscreen]
  );

  // Memoized distributeImages function
  const distributeImages = useCallback(
    (numColumns: number) => {
      const columns = Array.from(
        { length: numColumns },
        () => [] as ImageData[]
      );
      images.forEach((image, index) => {
        const columnIndex = index % numColumns;
        columns[columnIndex].push(image);
      });
      return columns;
    },
    [images]
  );

  // Update active layout and column count based on window size
  useEffect(() => {
    const updateLayout = () => {
      let columnsToUse: number;

      if (userColumnCount) {
        columnsToUse = userColumnCount;
      } else {
        // Default responsive layouts
        const width = window.innerWidth;
        if (width < 640) columnsToUse = 1;
        else if (width < 768) columnsToUse = 2;
        else if (width < 1280) columnsToUse = 3;
        else if (width < 1536) columnsToUse = 4;
        else columnsToUse = 5;
      }

      setActiveColumnCount(columnsToUse);
      setActiveLayout(distributeImages(columnsToUse));
    };

    // Initial update
    updateLayout();

    // Add resize listener
    window.addEventListener("resize", updateLayout);

    // Cleanup
    return () => window.removeEventListener("resize", updateLayout);
  }, [userColumnCount, distributeImages]);

  // Loading state
  if (!category) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <h1 className="text-white text-2xl">Category not found</h1>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-neutral-900 py-20"
    >
      <div className="mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            {capitalizeFirstLetter(category)}
          </h1>
          <p className="text-gray-400">
            My {capitalizeFirstLetter(category)} Portfolio 🥰
          </p>
        </motion.div>

        {/* Dynamic Column Layout */}
        <div className="flex flex-row justify-between gap-4">
          {activeLayout.map((column, columnIndex) => (
            <div
              key={`col-${activeColumnCount}-${columnIndex}`}
              className="flex-col relative space-y-4 flex"
              style={{ width: `${100 / activeColumnCount - 2}%` }}
            >
              {column.map((image, index) => (
                <ImageCard
                  key={`${image.src}-${columnIndex}-${index}`}
                  image={image}
                  index={columnIndex + index * activeColumnCount}
                  totalColumns={activeColumnCount}
                  onImageClick={handleImageClick}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Settings Panel */}
      <SettingsPanel
        userColumnCount={userColumnCount}
        setUserColumnCount={setUserColumnCount}
        activeColumnCount={activeColumnCount}
      />

      {/* Fullscreen Image Viewer */}
      <AnimatePresence>
        {selectedImage && (
          <FullscreenViewer
            selectedImage={selectedImage}
            onClose={handleClose}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CategoryPageContent;
