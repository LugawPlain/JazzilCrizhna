import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
// Import date utils
import { formatDisplayDate, getEndDateFromRange } from "@/utils/dateUtils";

// Define ImageData interface - consider moving to src/types/index.ts later
export interface ImageData {
  src: string;
  alt: string;
  date?: string; // Backwards compatibility
  eventDate: string; // Formatted for display
  rawEventDate: string | null; // Original from API for sorting
  photographer: string;
  photographerLink: string;
  location: string;
  event: string;
  advertisingLink?: string | null;
  id?: string; // Database ID
  r2FileKey?: string; // R2 object key
  originalFilename?: string;
  uploadedAt?: string | null; // ISO string
  contentType?: string;
  category?: string;
}

/**
 * Custom hook to manage fetching, sorting, and updating category images.
 *
 * @param category The category name to fetch images for.
 * @param r2PublicUrl The public base URL for R2 images.
 * @returns State and handlers for category images.
 */
export function useImages(category: string, r2PublicUrl: string | undefined) {
  const [images, setImages] = useState<ImageData[]>([]); // Final sorted images for display
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pinnedImageKeys, setPinnedImageKeys] = useState<Set<string>>(
    new Set()
  );
  const [fetchedRawUnsortedImages, setFetchedRawUnsortedImages] = useState<
    ImageData[] | null
  >(null); // Unsorted, fetched images
  const { status: sessionStatus } = useSession(); // Needed for pinned fetch timing

  // Effect 1: Fetch raw images when category or R2 URL changes
  useEffect(() => {
    // Reset state for new category fetch
    setImages([]);
    setFetchedRawUnsortedImages(null);
    setError(null);
    setLoading(true);

    if (!r2PublicUrl) {
      setError("Configuration error: R2 public URL is not set.");
      setLoading(false);
      return;
    }
    if (!category) {
      // If category is not yet available, stop loading and wait
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    const fetchImages = async () => {
      try {
        const timestamp = Date.now(); // Cache busting
        const response = await fetch(
          `/api/fetchimages?category=${encodeURIComponent(
            category
          )}&t=${timestamp}`,
          { signal }
        );

        if (!response.ok) {
          let errorMsg = `Error fetching images: ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorData.message || errorMsg;
          } catch (error: unknown) {
            console.error("Error fetching images:", error);
            /* Ignore */
          }
          throw new Error(errorMsg);
        }

        const responseData = await response.json();
        const fetchedData: ImageData[] = Array.isArray(responseData)
          ? responseData
          : responseData.images || [];

        if (responseData.revalidated) {
          console.log(
            "[useImages] Data revalidated at:",
            responseData.timestamp
          );
        }

        const formattedImages: ImageData[] = fetchedData.map((item) => ({
          src: `${r2PublicUrl}/${item.r2FileKey}`,
          alt: item.originalFilename || `Image for ${category}`,
          eventDate: formatDisplayDate(item.eventDate || null),
          date: formatDisplayDate(item.eventDate || null), // Backwards compatibility
          rawEventDate: item.eventDate || null,
          photographer: item.photographer || "Unknown",
          photographerLink: item.photographerLink || "#",
          location: item.location || "Unknown",
          event: item.event || "Unknown",
          id: item.id,
          r2FileKey: item.r2FileKey,
          originalFilename: item.originalFilename,
          uploadedAt: item.uploadedAt,
          contentType: item.contentType,
          category: item.category,
          advertisingLink: item.advertisingLink || null,
        }));

        setFetchedRawUnsortedImages(formattedImages);
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") {
          console.log("Fetch aborted"); // Request was cancelled, ignore
        } else {
          console.error("Fetch error:", error);
          setError(
            error instanceof Error ? error.message : "An unknown error occurred"
          );
          setFetchedRawUnsortedImages([]); // Set to empty array on error to stop loading in sort effect
          setLoading(false); // Stop loading on fetch error
        }
      }
    };

    fetchImages();

    // Cleanup function
    return () => {
      controller.abort(); // Abort the fetch request on cleanup
    };
  }, [category, r2PublicUrl]);

  // Effect 2: Fetch pinned image keys when category or session status changes
  useEffect(() => {
    // Return early if category is missing or session is still loading
    if (!category) {
      setPinnedImageKeys(new Set()); // Clear pinned keys if no category
      return;
    }
    if (sessionStatus === "loading") {
      // Don't fetch until session status is resolved
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    const fetchPinnedStatus = async () => {
      try {
        const response = await fetch(
          `/api/pinned-images?category=${encodeURIComponent(category)}`,
          { signal } // Pass signal to fetch
        );

        if (response.ok) {
          const pinnedKeys: string[] = await response.json();
          // Update state only if fetch wasn't aborted
          setPinnedImageKeys(new Set(pinnedKeys));
        } else {
          // Handle non-ok response (but not abortion)
          console.error(
            "[useImages] Failed to fetch pinned images:",
            response.statusText
          );
          setPinnedImageKeys(new Set()); // Reset on failure
        }
      } catch (error: unknown) {
        // Check if the error is due to abortion
        if (error instanceof Error && error.name === "AbortError") {
          console.log("[useImages] Pinned images fetch aborted.");
          // Don't update state if the request was aborted
        } else {
          // Handle actual fetch errors
          console.error("[useImages] Error fetching pinned images:", error);
          setPinnedImageKeys(new Set()); // Reset on error
        }
      }
    };

    fetchPinnedStatus();

    // Cleanup function: Abort fetch if component unmounts or deps change
    return () => {
      controller.abort();
    };
  }, [category, sessionStatus]); // Dependencies remain the same

  // Effect 3: Sort images when raw images or pinned keys change
  useEffect(() => {
    if (fetchedRawUnsortedImages === null) {
      // Still waiting for fetch or fetch failed but setFetchedRawUnsortedImages wasn't called yet
      // Loading state is managed by fetch effect
      return;
    }

    const sorted = [...fetchedRawUnsortedImages].sort((a, b) => {
      const aIsPinned = !!a.r2FileKey && pinnedImageKeys.has(a.r2FileKey);
      const bIsPinned = !!b.r2FileKey && pinnedImageKeys.has(b.r2FileKey);

      // Pinned images first
      if (aIsPinned !== bIsPinned) return aIsPinned ? -1 : 1;

      // Then sort by date (newest first)
      let dateA: number = 0;
      let dateB: number = 0;

      const extractedDateA = getEndDateFromRange(a.rawEventDate);
      dateA = extractedDateA ? extractedDateA.getTime() : 0;
      if (dateA === 0 && a.uploadedAt) {
        try {
          dateA = new Date(a.uploadedAt).getTime();
        } catch {
          dateA = 0;
        }
      }

      const extractedDateB = getEndDateFromRange(b.rawEventDate);
      dateB = extractedDateB ? extractedDateB.getTime() : 0;
      if (dateB === 0 && b.uploadedAt) {
        try {
          dateB = new Date(b.uploadedAt).getTime();
        } catch {
          dateB = 0;
        }
      }

      const timeA = isNaN(dateA) ? 0 : dateA;
      const timeB = isNaN(dateB) ? 0 : dateB;
      if (timeB !== timeA) return timeB - timeA;

      // Fallback sort by r2FileKey if dates are the same or invalid
      return (b.r2FileKey || "").localeCompare(a.r2FileKey || "");
    });

    setImages(sorted);
    setLoading(false); // Data is fetched and sorted, stop loading
  }, [fetchedRawUnsortedImages, pinnedImageKeys]);

  // Callback to update image details locally (e.g., after modal edit)
  const handleDetailsUpdated = useCallback(
    (updatedImage: Partial<ImageData>) => {
      // Function to apply update to an image list
      const updateList = (list: ImageData[] | null): ImageData[] | null =>
        list?.map((img) =>
          (img.id && img.id === updatedImage.id) || // Match by DB ID if available
          (img.r2FileKey && img.r2FileKey === updatedImage.r2FileKey) // Match by R2 Key otherwise
            ? { ...img, ...updatedImage }
            : img
        ) ?? null;

      // Update both raw and sorted lists
      setFetchedRawUnsortedImages(updateList);
      // Sorting effect will re-run and update `images`
    },
    []
  );

  // Callback to remove an image locally (e.g., after modal delete or bulk delete)
  // Accepts id or r2FileKey
  const handleImageDeleted = useCallback((identifier: string) => {
    // Function to filter list
    const filterList = (list: ImageData[] | null): ImageData[] | null =>
      list?.filter(
        (img) => img.id !== identifier && img.r2FileKey !== identifier
      ) ?? null;

    // Update both raw and sorted lists
    setFetchedRawUnsortedImages(filterList);
    // Sorting effect will re-run and update `images`

    // Also remove from pinned keys if it was pinned
    setPinnedImageKeys((prevKeys) => {
      if (prevKeys.has(identifier)) {
        const newKeys = new Set(prevKeys);
        newKeys.delete(identifier);
        return newKeys;
      }
      return prevKeys;
    });
  }, []);

  return {
    images, // Sorted images for display
    loading, // Loading state
    error, // Fetching error message
    pinnedImageKeys, // Set of pinned image keys
    setPinnedImageKeys, // Setter for optimistic updates (used by useImagePinning)
    handleDetailsUpdated, // Callback to update an image's details locally
    handleImageDeleted, // Callback to remove an image locally by id or r2FileKey
  };
}
