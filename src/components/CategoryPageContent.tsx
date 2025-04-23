"use client";
import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import SettingsPanel from "@/app/components/SettingsPanel";
import ImageCard from "@/components/ImageCard";
import ImageDetailModal from "@/components/ImageDetailModal";
import { formatDisplayDate, getEndDateFromRange } from "@/utils/dateUtils";
import { useImages, ImageData } from "@/hooks/useImages";
import { useResponsiveImageGrid } from "@/hooks/useResponsiveImageGrid";

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
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );
  const [userColumnCount, setUserColumnCount] = useState<number | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedImageKeys, setSelectedImageKeys] = useState<Set<string>>(
    new Set()
  );

  // Hooks for routing and params
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get session data
  const { data: session, status: sessionStatus } = useSession();
  const isAdmin = session?.user?.role === "admin";

  // Decode category name from URL
  const category = decodeURIComponent(rawCategory);

  // Get R2 Public URL from environment variable
  const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_SUB_URL;

  // Custom Hook for Image Data
  const {
    images,
    loading,
    error,
    pinnedImageKeys,
    setPinnedImageKeys,
    handleDetailsUpdated,
    handleImageDeleted,
  } = useImages(category, r2PublicUrl);

  // Use the new layout hook
  const { activeLayout, activeColumnCount } = useResponsiveImageGrid(
    images,
    userColumnCount,
    loading
  );

  // Function to capitalize first letter - memoized
  const capitalizeFirstLetter = useCallback((string: string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }, []);

  // Modal open handler
  const handleImageClick = useCallback(
    (index: number) => {
      setSelectedImageIndex(index);
      const imageId = images[index]?.id || images[index]?.r2FileKey;
      if (imageId) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("imageId", imageId);
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      }
    },
    [images, router, pathname, searchParams]
  );

  // Modal close handler
  const handleCloseModal = useCallback(() => {
    setSelectedImageIndex(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("imageId");
    const queryString = params.toString();
    router.push(`${pathname}${queryString ? `?${queryString}` : ""}`, {
      scroll: false,
    });
  }, [router, pathname, searchParams]);

  // Navigation handlers for Modal
  const handleModalNext = useCallback(() => {
    if (selectedImageIndex === null) return;
    const newIndex = (selectedImageIndex + 1) % images.length;
    handleImageClick(newIndex);
  }, [selectedImageIndex, images.length, handleImageClick]);

  const handleModalPrev = useCallback(() => {
    if (selectedImageIndex === null) return;
    const newIndex = (selectedImageIndex - 1 + images.length) % images.length;
    handleImageClick(newIndex);
  }, [selectedImageIndex, images.length, handleImageClick]);

  // Keyboard navigation for Modal with editing support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImageIndex !== null) {
        const isInputField =
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement;

        if (e.key === "Escape") {
          handleCloseModal();
        } else if (e.key === "ArrowRight" && !isInputField) {
          handleModalNext();
        } else if (e.key === "ArrowLeft" && !isInputField) {
          handleModalPrev();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCloseModal, handleModalNext, handleModalPrev, selectedImageIndex]);

  // Pin/Unpin handler (will be moved to useImagePinning later)
  const handlePinClick = useCallback(
    async (imageToToggle: ImageData) => {
      if (!isAdmin || !imageToToggle.r2FileKey) {
        console.warn("Pin action aborted: Not admin or image missing key.");
        return;
      }

      const key = imageToToggle.r2FileKey;
      const isCurrentlyPinned = pinnedImageKeys.has(key); // Use pinnedImageKeys from hook

      // Optimistic UI update using setter from hook
      setPinnedImageKeys((prevKeys) => {
        const newKeys = new Set(prevKeys);
        if (isCurrentlyPinned) {
          newKeys.delete(key);
        } else {
          newKeys.add(key);
        }
        return newKeys;
      });

      // API call to update backend
      try {
        const response = await fetch("/api/toggle-pin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            r2FileKey: key,
            category: imageToToggle.category,
            pin: !isCurrentlyPinned,
          }),
        });

        if (!response.ok) {
          // Revert optimistic update on failure using setter from hook
          console.error("Failed to update pin status:", response.statusText);
          setPinnedImageKeys((prevKeys) => {
            const revertedKeys = new Set(prevKeys);
            if (isCurrentlyPinned) {
              revertedKeys.add(key);
            } else {
              revertedKeys.delete(key);
            }
            return revertedKeys;
          });
        } else {
          console.log(`Image ${key} pin status toggled successfully.`);
        }
      } catch (error) {
        console.error("Error toggling pin status:", error);
        // Revert optimistic update on error using setter from hook
        setPinnedImageKeys((prevKeys) => {
          const revertedKeys = new Set(prevKeys);
          if (isCurrentlyPinned) {
            revertedKeys.add(key);
          } else {
            revertedKeys.delete(key);
          }
          return revertedKeys;
        });
      }
    },
    [isAdmin, pinnedImageKeys, setPinnedImageKeys] // Depends on hook values
  );

  // --- Bulk Selection Handlers ---
  const toggleSelectMode = () => {
    setIsSelecting(!isSelecting);
    setSelectedImageKeys(new Set());
  };

  const handleImageSelectToggle = useCallback((imageKey: string) => {
    setSelectedImageKeys((prevKeys) => {
      const newKeys = new Set(prevKeys);
      if (newKeys.has(imageKey)) {
        newKeys.delete(imageKey);
      } else {
        newKeys.add(imageKey);
      }
      return newKeys;
    });
  }, []);

  const handleBulkDelete = async () => {
    if (selectedImageKeys.size === 0) return;

    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedImageKeys.size} selected image(s)? This cannot be undone.`
      )
    ) {
      return;
    }

    console.log(
      `Attempting to bulk delete ${selectedImageKeys.size} images for category ${category}...`
    );

    try {
      const imageKeysArray = Array.from(selectedImageKeys);
      const response = await fetch("/api/admin/bulkdeleteimages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: category, imageKeys: imageKeysArray }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Bulk delete API Error:", result);
        throw new Error(
          result.error || `Failed to delete images (${response.status})`
        );
      }

      console.log("Bulk delete successful:", result.message);
      alert(
        result.message ||
          `${imageKeysArray.length} image(s) deleted successfully.`
      );

      setSelectedImageKeys(new Set());
      setIsSelecting(false);

      imageKeysArray.forEach((key) => {
        handleImageDeleted(key);
      });
    } catch (error: any) {
      console.error("Error during bulk delete:", error);
      alert(`Error deleting images: ${error.message}`);
    }
  };
  // --- End Bulk Selection Handlers ---

  // Render logic
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

        {isAdmin && (
          <div className="mb-6 flex justify-end gap-4 items-center">
            {!isSelecting ? (
              <button
                onClick={toggleSelectMode}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-neutral-900 transition"
              >
                Select Images
              </button>
            ) : (
              <>
                <span className="text-sm text-neutral-400">
                  {selectedImageKeys.size} selected
                </span>
                <button
                  onClick={handleBulkDelete}
                  disabled={selectedImageKeys.size === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-neutral-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete Selected
                </button>
                <button
                  onClick={toggleSelectMode}
                  className="px-4 py-2 text-sm font-medium text-neutral-300 bg-neutral-700 rounded-md hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 focus:ring-offset-neutral-900 transition"
                >
                  Cancel Selection
                </button>
              </>
            )}
          </div>
        )}

        <div className="flex flex-row justify-between gap-4">
          {activeLayout.map((column, columnIndex) => (
            <div
              key={`col-${activeColumnCount}-${columnIndex}`}
              className="flex-col relative space-y-4 flex"
              style={{ width: `${100 / activeColumnCount - 2}%` }}
            >
              {column.map((image) => {
                const originalIndex = images.findIndex(
                  (img) =>
                    (img.id || img.r2FileKey) === (image.id || image.r2FileKey)
                );
                if (originalIndex === -1) {
                  console.warn(
                    "Could not find original index for image:",
                    image
                  );
                  return null;
                }
                return (
                  <ImageCard
                    key={image.id || image.src}
                    image={image}
                    index={originalIndex}
                    onImageClick={() => handleImageClick(originalIndex)}
                    totalColumns={activeColumnCount}
                    isAdmin={isAdmin}
                    isSelecting={isSelecting}
                    isSelected={
                      !!image.r2FileKey &&
                      selectedImageKeys.has(image.r2FileKey)
                    }
                    onImageSelectToggle={handleImageSelectToggle}
                    pinned={
                      !!image.r2FileKey && pinnedImageKeys.has(image.r2FileKey)
                    }
                    onPinClick={() => {
                      handlePinClick(image);
                    }}
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
          <ImageDetailModal
            image={selectedImageData}
            isAdmin={isAdmin}
            onClose={handleCloseModal}
            onNext={handleModalNext}
            onPrev={handleModalPrev}
            onDetailsUpdated={handleDetailsUpdated}
            onImageDeleted={handleImageDeleted}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CategoryPageContent;
