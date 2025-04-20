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
  id?: string;
  r2FileKey?: string;
  originalFilename?: string;
  eventDate?: string | null;
  uploadedAt?: string | null;
  contentType?: string;
  category?: string;
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
  category: rawCategory,
}) => {
  // State management
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [userColumnCount, setUserColumnCount] = useState<number | null>(null);
  const [activeLayout, setActiveLayout] = useState<ImageData[][]>([]);
  const [activeColumnCount, setActiveColumnCount] = useState(1);

  // Decode category name from URL
  const category = decodeURIComponent(rawCategory);

  // Get R2 Public URL from environment variable
  const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

  // Function to capitalize first letter - memoized
  const capitalizeFirstLetter = useCallback((string: string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }, []);

  // Fetch images on component mount
  useEffect(() => {
    if (!r2PublicUrl) {
      setError("Configuration error: R2 public URL is not set.");
      setLoading(false);
      return;
    }

    const fetchImages = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/getimages?category=${encodeURIComponent(category)}`
        );

        if (!response.ok) {
          let errorMsg = `Error fetching images: ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorData.message || errorMsg;
          } catch (e) {
            /* Ignore parsing error, use status text */
          }
          throw new Error(errorMsg);
        }

        const fetchedData: any[] = await response.json();
        console.log("Fetched raw data:", fetchedData);

        const formattedImages: ImageData[] = fetchedData.map((item) => {
          const imageUrl = `${r2PublicUrl}/${item.r2FileKey}`;
          const displayDate = item.eventDate
            ? new Date(item.eventDate).toLocaleDateString()
            : item.uploadedAt
            ? new Date(item.uploadedAt).toLocaleDateString()
            : "N/A";

          return {
            src: imageUrl,
            alt: item.originalFilename || `Image for ${category}`,
            date: displayDate,
            photographer: item.photographer || "Unknown",
            photographerLink: "#",
            location: item.location || "Unknown",
            event: item.event || "Unknown",
            id: item.id,
            r2FileKey: item.r2FileKey,
            originalFilename: item.originalFilename,
            eventDate: item.eventDate,
            uploadedAt: item.uploadedAt,
            contentType: item.contentType,
            category: item.category,
          };
        });

        const sortedImages = [...formattedImages].sort((a, b) => {
          const dateA = a.eventDate
            ? new Date(a.eventDate).getTime()
            : a.uploadedAt
            ? new Date(a.uploadedAt).getTime()
            : 0;
          const dateB = b.eventDate
            ? new Date(b.eventDate).getTime()
            : b.uploadedAt
            ? new Date(b.uploadedAt).getTime()
            : 0;
          const timeA = isNaN(dateA) ? 0 : dateA;
          const timeB = isNaN(dateB) ? 0 : dateB;
          return timeB - timeA;
        });

        setImages(sortedImages);
      } catch (error: unknown) {
        console.error("Error fetching images:", error);
        setError(
          error instanceof Error ? error.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    if (category) {
      fetchImages();
    }
  }, [category, r2PublicUrl]);

  // Event handlers
  const handleClose = useCallback(() => {
    setSelectedImageIndex(null);

    if (
      isFullscreen &&
      (document.fullscreenElement || (document as any).webkitFullscreenElement)
    ) {
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
    if (selectedImageIndex === null) return;
    const newIndex =
      selectedImageIndex < images.length - 1 ? selectedImageIndex + 1 : 0;
    setSelectedImageIndex(newIndex);
  }, [selectedImageIndex, images.length]);

  const handlePrev = useCallback(() => {
    if (selectedImageIndex === null) return;
    const newIndex =
      selectedImageIndex > 0 ? selectedImageIndex - 1 : images.length - 1;
    setSelectedImageIndex(newIndex);
  }, [selectedImageIndex, images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImageIndex !== null) {
        if (e.key === "Escape") {
          handleClose();
        } else if (e.key === "ArrowRight") {
          handleNext();
        } else if (e.key === "ArrowLeft") {
          handlePrev();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose, handleNext, handlePrev, selectedImageIndex]);

  // Image click handler
  const handleImageClick = useCallback(
    async (index: number) => {
      setSelectedImageIndex(index);
      try {
        if (!isFullscreen && isFullscreenSupported()) {
          await document.documentElement.requestFullscreen();
          setIsFullscreen(true);
        }
      } catch (err: unknown) {
        console.error("Error entering fullscreen:", err);
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
        const width = window.innerWidth;
        if (width < 640) columnsToUse = 1;
        else if (width < 768) columnsToUse = 2;
        else if (width < 1024) columnsToUse = 3;
        else if (width < 1280) columnsToUse = 4;
        else columnsToUse = 5;
      }

      setActiveColumnCount(columnsToUse);
      setActiveLayout(distributeImages(columnsToUse));
    };

    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, [userColumnCount, distributeImages]);

  // Render logic
  if (!r2PublicUrl) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center text-red-500 text-xl p-8">
        Configuration Error: NEXT_PUBLIC_R2_PUBLIC_URL environment variable is
        not set.
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

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center text-red-500 text-xl p-8">
        Error loading images: {error}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center text-gray-400 text-xl p-8">
        No images found for the category: {capitalizeFirstLetter(category)}
      </div>
    );
  }

  const selectedImageData =
    selectedImageIndex !== null ? images[selectedImageIndex] : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-neutral-900 pt-24 pb-16"
    >
      <div className="mx-auto px-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            {capitalizeFirstLetter(category)}
          </h1>
          <p className="text-gray-400">{images.length} image(s)</p>
        </motion.div>

        <div className="flex flex-row justify-between gap-4">
          {activeLayout.map((column, columnIndex) => (
            <div
              key={`col-${activeColumnCount}-${columnIndex}`}
              className="flex-col relative space-y-4 flex"
              style={{ width: `${100 / activeColumnCount - 2}%` }}
            >
              {column.map((image) => {
                const originalIndex = images.findIndex(
                  (img) => img.id === image.id
                );
                return (
                  <ImageCard
                    key={image.id || image.src}
                    image={image}
                    index={originalIndex}
                    onImageClick={() => handleImageClick(originalIndex)}
                    totalColumns={activeColumnCount}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <SettingsPanel
        userColumnCount={userColumnCount}
        setUserColumnCount={setUserColumnCount}
        activeColumnCount={activeColumnCount}
      />

      <AnimatePresence>
        {selectedImageData && (
          <FullscreenViewer
            selectedImage={selectedImageData}
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
