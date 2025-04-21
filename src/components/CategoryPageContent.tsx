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
  const [userColumnCount, setUserColumnCount] = useState<number | null>(null);
  const [activeLayout, setActiveLayout] = useState<ImageData[][]>([]);
  const [activeColumnCount, setActiveColumnCount] = useState(1);
  const [pinnedImageKeys, setPinnedImageKeys] = useState<Set<string>>(
    new Set()
  );
  const [rawFetchedImages, setRawFetchedImages] = useState<ImageData[] | null>(
    null
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
        const response = await fetch(
          `/api/fetchimages?category=${encodeURIComponent(category)}`
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

  // Keyboard navigation for Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only act if modal is effectively open (selectedImageIndex is not null)
      if (selectedImageIndex !== null) {
        if (e.key === "Escape") {
          handleCloseModal();
        } else if (e.key === "ArrowRight") {
          handleModalNext();
        } else if (e.key === "ArrowLeft") {
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
                    pinned={
                      !!image.r2FileKey && pinnedImageKeys.has(image.r2FileKey)
                    }
                    onPinClick={handlePinClick}
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
            onClose={handleCloseModal}
            onNext={handleModalNext} // Pass navigation handlers
            onPrev={handleModalPrev}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CategoryPageContent;
