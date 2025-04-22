"use client";
import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import SettingsPanel from "@/app/components/SettingsPanel";
import ImageCard from "@/components/ImageCard";
import ImageDetailModal from "@/components/ImageDetailModal";

interface ImageData {
  src: string;
  alt: string;
  date?: string; // For backwards compatibility - will be phased out
  eventDate: string; // FOR DISPLAY: Formatted string (e.g., "MM/DD/YYYY" or "MM/DD/YYYY - MM/DD/YYYY")
  rawEventDate: string | null; // Original string from API (ISO, M/D/Y, M/D/Y - M/D/Y, or null)
  photographer: string;
  photographerLink: string;
  location: string;
  event: string;
  advertisingLink?: string | null;
  id?: string;
  r2FileKey?: string;
  originalFilename?: string;
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

// Helper function to format the display date string
function formatDisplayDate(rawDate: string | null | undefined): string {
  if (!rawDate) return "N/A";

  const trimmedDate = rawDate.trim();

  // If it's already in the desired range format M/D/Y - M/D/Y or single M/D/Y, return as is
  // (We assume the upload API now stores these formats directly)
  const simpleDateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
  const simpleRangeRegex =
    /^\d{1,2}\/\d{1,2}\/\d{4}\s*-\s*\d{1,2}\/\d{1,2}\/\d{4}$/;
  if (simpleDateRegex.test(trimmedDate) || simpleRangeRegex.test(trimmedDate)) {
    return trimmedDate;
  }

  // If it's not the simple format, try parsing it as a date (could be ISO)
  const dateObj = new Date(trimmedDate);
  if (!isNaN(dateObj.getTime())) {
    // Return in a consistent local date format
    return dateObj.toLocaleDateString();
  }

  // Fallback: If it's not a recognized format, return the original string or N/A
  console.warn(`[formatDisplayDate] Unrecognized date format: ${trimmedDate}`);
  return trimmedDate || "N/A";
}

// Add a helper function to extract the end date from a date range string
const getEndDateFromRange = (
  dateString: string | null | undefined
): Date | null => {
  if (!dateString) return null;

  // Check if it's a range (contains a hyphen)
  if (dateString.includes("-")) {
    // Extract the end date (after the hyphen)
    const endDateStr = dateString.split("-")[1].trim();
    const endDate = new Date(endDateStr);
    return isNaN(endDate.getTime()) ? null : endDate;
  }

  // Not a range, just a single date
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
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
  const [userColumnCount, setUserColumnCount] = useState<number | null>(null);
  const [activeLayout, setActiveLayout] = useState<ImageData[][]>([]);
  const [activeColumnCount, setActiveColumnCount] = useState(1);
  const [pinnedImageKeys, setPinnedImageKeys] = useState<Set<string>>(
    new Set()
  );
  const [rawFetchedImages, setRawFetchedImages] = useState<ImageData[] | null>(
    null
  );
  // State for bulk selection
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
      setRawFetchedImages(null);
      setImages([]);

      try {
        // Add timestamp param to prevent caching
        const timestamp = Date.now();
        const response = await fetch(
          `/api/fetchimages?category=${encodeURIComponent(
            category
          )}&t=${timestamp}`
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

        const responseData = await response.json();
        // Handle both formats: direct array or {images: array} format
        const fetchedData: any[] = Array.isArray(responseData)
          ? responseData
          : responseData.images || [];

        console.log("Fetched raw data:", fetchedData);
        if (responseData.revalidated) {
          console.log(
            "Data was successfully revalidated at:",
            responseData.timestamp
          );
        }

        const formattedImages: ImageData[] = fetchedData.map((item) => {
          const imageUrl = `${r2PublicUrl}/${item.r2FileKey}`;
          const rawEventDate = item.eventDate || null; // Get original value
          // Use the helper to format for display
          const displayDate = formatDisplayDate(rawEventDate);

          return {
            src: imageUrl,
            alt: item.originalFilename || `Image for ${category}`,
            eventDate: displayDate, // Use the formatted display date
            date: displayDate, // Backwards compatibility
            rawEventDate: rawEventDate, // Store the original string
            photographer: item.photographer || "Unknown",
            photographerLink: item.photographerLink || "#", // Use fetched link or default to "#"
            location: item.location || "Unknown",
            event: item.event || "Unknown",
            id: item.id,
            r2FileKey: item.r2FileKey,
            originalFilename: item.originalFilename,
            uploadedAt: item.uploadedAt, // Keep original uploadedAt for fallback sorting
            contentType: item.contentType,
            category: item.category,
            advertisingLink: item.advertisingLink || null,
          };
        });

        setRawFetchedImages(formattedImages);
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

  // Fetch pinned images on mount (for sorting)
  useEffect(() => {
    const fetchPinnedStatus = async () => {
      // Fetch pinned status for all users to ensure correct sorting
      if (category) {
        try {
          // TODO: Ensure this API endpoint allows reads for all users (or adjust if needed)
          const response = await fetch(
            `/api/pinned-images?category=${encodeURIComponent(category)}`
          );
          if (response.ok) {
            const pinnedKeys: string[] = await response.json();
            setPinnedImageKeys(new Set(pinnedKeys));
          } else {
            console.error(
              "Failed to fetch pinned images:",
              response.statusText
            );
          }
        } catch (error) {
          console.error("Error fetching pinned images:", error);
        }
      } else {
        // Clear pinned status if no category
        setPinnedImageKeys(new Set());
      }
    };

    // Fetch only when session status is determined and category is known
    // Session status check ensures we don't fetch before knowing if user *could* be admin
    // (even though fetching is now for all, the dependency makes sense)
    if (sessionStatus !== "loading" && category) {
      fetchPinnedStatus();
    }
  }, [category, sessionStatus]); // Removed isAdmin dependency

  // Effect to sort images once raw data and pinned keys are available
  useEffect(() => {
    if (rawFetchedImages === null) {
      // Don't sort until images are fetched
      return;
    }

    const sorted = [...rawFetchedImages].sort((a, b) => {
      const aIsPinned = !!a.r2FileKey && pinnedImageKeys.has(a.r2FileKey);
      const bIsPinned = !!b.r2FileKey && pinnedImageKeys.has(b.r2FileKey);

      // 1. Pinned images first
      if (aIsPinned !== bIsPinned) {
        return aIsPinned ? -1 : 1;
      }

      // 2. Within pinned/unpinned, sort by date (newest first)
      // Use rawEventDate for sorting logic
      let dateA: number = 0;
      let dateB: number = 0;

      // Use rawEventDate with getEndDateFromRange
      if (a.rawEventDate) {
        const extractedDate = getEndDateFromRange(a.rawEventDate); // Use raw date
        dateA = extractedDate ? extractedDate.getTime() : 0;
      } else if (a.uploadedAt) {
        // Fallback to uploadedAt
        dateA = new Date(a.uploadedAt).getTime();
      }

      if (b.rawEventDate) {
        const extractedDate = getEndDateFromRange(b.rawEventDate); // Use raw date
        dateB = extractedDate ? extractedDate.getTime() : 0;
      } else if (b.uploadedAt) {
        // Fallback to uploadedAt
        dateB = new Date(b.uploadedAt).getTime();
      }

      const timeA = isNaN(dateA) ? 0 : dateA;
      const timeB = isNaN(dateB) ? 0 : dateB;
      return timeB - timeA; // Newest first
    });

    setImages(sorted);
    setLoading(false); // Stop loading indicator now that images are sorted and ready
  }, [rawFetchedImages, pinnedImageKeys]); // Trigger sorting when either data changes

  // Effect to handle opening modal based on URL query parameter
  useEffect(() => {
    const imageIdFromUrl = searchParams.get("imageId");
    // Only run if images are loaded and the modal isn't already open via click
    if (
      imageIdFromUrl &&
      !loading &&
      images.length > 0 &&
      selectedImageIndex === null
    ) {
      const index = images.findIndex(
        (img) => img.id === imageIdFromUrl || img.r2FileKey === imageIdFromUrl
      );
      if (index !== -1) {
        setSelectedImageIndex(index);
        // Don't push history state here, just reflect the existing URL state
      } else {
        console.warn(
          `Image ID ${imageIdFromUrl} from URL not found in loaded images.`
        );
        // Optional: Remove invalid query param if image not found
        // router.push(pathname, { scroll: false });
      }
    }
    // If no imageId in URL, ensure modal is closed (unless just opened by click)
    // This handles browser back button correctly
    if (!imageIdFromUrl && selectedImageIndex !== null) {
      // Check if the modal was likely closed by user interaction rather than back button
      // This check is imperfect but avoids closing immediately after clicking open
      setTimeout(() => {
        const currentQueryId = new URLSearchParams(window.location.search).get(
          "imageId"
        );
        if (!currentQueryId) {
          setSelectedImageIndex(null);
        }
      }, 50); // Small delay to allow click handler to update state
    }
  }, [searchParams, images, loading, selectedImageIndex, pathname]); // Add dependencies

  // Callback to update image data in the parent state after modal edit
  const handleDetailsUpdated = useCallback(
    (updatedImage: Partial<ImageData>) => {
      setImages((prevImages) =>
        prevImages.map((img) =>
          img.id === updatedImage.id || img.r2FileKey === updatedImage.r2FileKey
            ? { ...img, ...updatedImage } // Merge updates
            : img
        )
      );
      // Also update rawFetchedImages if it exists to keep them in sync
      setRawFetchedImages(
        (prevRawImages) =>
          prevRawImages?.map((img) =>
            img.id === updatedImage.id ||
            img.r2FileKey === updatedImage.r2FileKey
              ? { ...img, ...updatedImage }
              : img
          ) || null
      );
      // No need to close modal here, modal controls its state
    },
    []
  ); // No dependencies needed if only using setters

  // Modal open handler
  const handleImageClick = useCallback(
    (index: number) => {
      setSelectedImageIndex(index);
      const imageId = images[index]?.id || images[index]?.r2FileKey; // Use id or r2FileKey as identifier
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
    // Remove the imageId query parameter
    const params = new URLSearchParams(searchParams.toString());
    params.delete("imageId");
    const queryString = params.toString();
    router.push(`${pathname}${queryString ? `?${queryString}` : ""}`, {
      scroll: false,
    });
  }, [router, pathname, searchParams]);

  // Navigation handlers for Modal (if needed)
  const handleModalNext = useCallback(() => {
    if (selectedImageIndex === null) return;
    const newIndex = (selectedImageIndex + 1) % images.length; // Wrap around
    handleImageClick(newIndex); // Reuse click logic to update URL and state
  }, [selectedImageIndex, images.length, handleImageClick]);

  const handleModalPrev = useCallback(() => {
    if (selectedImageIndex === null) return;
    const newIndex = (selectedImageIndex - 1 + images.length) % images.length; // Wrap around
    handleImageClick(newIndex); // Reuse click logic to update URL and state
  }, [selectedImageIndex, images.length, handleImageClick]);

  // Keyboard navigation for Modal with editing support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only act if modal is effectively open (selectedImageIndex is not null)
      if (selectedImageIndex !== null) {
        // Check if the event target is an input field
        const isInputField =
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement;

        if (e.key === "Escape") {
          handleCloseModal();
        } else if (e.key === "ArrowRight" && !isInputField) {
          // Only navigate right if not editing an input field
          handleModalNext();
        } else if (e.key === "ArrowLeft" && !isInputField) {
          // Only navigate left if not editing an input field
          handleModalPrev();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // Include modal handlers in dependencies
  }, [handleCloseModal, handleModalNext, handleModalPrev, selectedImageIndex]);

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

  // Pin/Unpin handler
  const handlePinClick = useCallback(
    async (imageToToggle: ImageData) => {
      if (!isAdmin || !imageToToggle.r2FileKey) {
        console.warn("Pin action aborted: Not admin or image missing key.");
        return;
      }

      const key = imageToToggle.r2FileKey;
      const isCurrentlyPinned = pinnedImageKeys.has(key);

      // Optimistic UI update
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
        // TODO: Implement this API endpoint
        const response = await fetch("/api/toggle-pin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            r2FileKey: key,
            category: imageToToggle.category, // Pass category for potential backend logic
            pin: !isCurrentlyPinned, // Send the desired state
          }),
        });

        if (!response.ok) {
          // Revert optimistic update on failure
          console.error("Failed to update pin status:", response.statusText);
          setPinnedImageKeys((prevKeys) => {
            const revertedKeys = new Set(prevKeys);
            if (isCurrentlyPinned) {
              revertedKeys.add(key); // Add back if delete failed
            } else {
              revertedKeys.delete(key); // Remove if add failed
            }
            return revertedKeys;
          });
          // Optionally show an error message to the user
        } else {
          console.log(`Image ${key} pin status toggled successfully.`);
        }
      } catch (error) {
        console.error("Error toggling pin status:", error);
        // Revert optimistic update on error
        setPinnedImageKeys((prevKeys) => {
          const revertedKeys = new Set(prevKeys);
          if (isCurrentlyPinned) {
            revertedKeys.add(key);
          } else {
            revertedKeys.delete(key);
          }
          return revertedKeys;
        });
        // Optionally show an error message to the user
      }
    },
    [isAdmin, pinnedImageKeys, category]
  ); // <-- Include dependencies

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
      // Distribute the *final sorted* images
      if (images.length > 0) {
        // Ensure images are loaded before distributing
        setActiveLayout(distributeImages(columnsToUse));
      }
    };

    // Don't run if images haven't been sorted yet
    if (!loading) {
      updateLayout();
      window.addEventListener("resize", updateLayout);
      return () => window.removeEventListener("resize", updateLayout);
    }
  }, [userColumnCount, distributeImages, images, loading]); // Depend on final 'images' and loading state

  // Add an onImageDeleted callback
  const handleImageDeleted = useCallback(
    (deletedImageId: string) => {
      // Close the modal if it's still open
      setSelectedImageIndex(null);

      // Remove the deleted image from state
      setImages((prevImages) =>
        prevImages.filter(
          (img) => img.id !== deletedImageId && img.r2FileKey !== deletedImageId
        )
      );

      // Also update rawFetchedImages to keep them in sync
      setRawFetchedImages((prevRawImages) =>
        prevRawImages
          ? prevRawImages.filter(
              (img) =>
                img.id !== deletedImageId && img.r2FileKey !== deletedImageId
            )
          : null
      );

      // Optionally: Remove image URL query parameter
      const params = new URLSearchParams(searchParams.toString());
      params.delete("imageId");
      const queryString = params.toString();
      router.push(`${pathname}${queryString ? `?${queryString}` : ""}`, {
        scroll: false,
      });
    },
    [router, pathname, searchParams]
  );

  // --- Bulk Selection Handlers ---
  const toggleSelectMode = () => {
    setIsSelecting(!isSelecting);
    setSelectedImageKeys(new Set()); // Clear selection when toggling mode
  };

  const handleImageSelectToggle = useCallback(
    (imageKey: string) => {
      setSelectedImageKeys((prevKeys) => {
        const newKeys = new Set(prevKeys);
        if (newKeys.has(imageKey)) {
          newKeys.delete(imageKey);
        } else {
          newKeys.add(imageKey);
        }
        return newKeys;
      });
    },
    [] // No dependencies needed
  );

  const handleBulkDelete = async () => {
    if (selectedImageKeys.size === 0) return;

    // Confirmation dialog
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
      ); // Basic feedback

      // Clear selection and exit select mode
      setSelectedImageKeys(new Set());
      setIsSelecting(false);

      // Remove deleted items from local state immediately for better UX
      // (Alternatively, rely solely on the revalidateTag refresh,
      // but this provides instant feedback)
      setImages((prev) =>
        prev.filter(
          (img) => !img.r2FileKey || !imageKeysArray.includes(img.r2FileKey)
        )
      );
      setRawFetchedImages((prev) =>
        prev
          ? prev.filter(
              (img) => !img.r2FileKey || !imageKeysArray.includes(img.r2FileKey)
            )
          : null
      );
    } catch (error: any) {
      console.error("Error during bulk delete:", error);
      alert(`Error deleting images: ${error.message}`); // Show error message to user
      // Optionally set an error state: setError(error.message);
    } finally {
      // Stop loading state if used
      // setLoading(false);
    }
  };
  // --- End Bulk Selection Handlers ---

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

        {/* --- Bulk Action Controls (Admin Only) --- */}
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
        {/* --- End Bulk Action Controls --- */}

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
                    (img.id || img.r2FileKey) === (image.id || image.r2FileKey) // Find by id or key
                );
                // Ensure originalIndex is valid before rendering
                if (originalIndex === -1) {
                  console.warn(
                    "Could not find original index for image:",
                    image
                  );
                  return null;
                }
                return (
                  <ImageCard
                    key={image.id || image.src} // Use id or src as key
                    image={image}
                    index={originalIndex}
                    // Pass the modified click handler
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
                      // No need to await here, let it run in the background
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
