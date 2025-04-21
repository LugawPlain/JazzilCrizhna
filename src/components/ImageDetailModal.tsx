import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

// Define the same ImageData interface or import it
interface ImageData {
  src: string;
  alt: string;
  date?: string; // Keep for backward compatibility
  eventDate: string; // Add the eventDate field
  photographer: string;
  photographerLink: string;
  location: string;
  event: string;
  id?: string;
  r2FileKey?: string;
  category?: string; // Ensure category is available if needed for API call
}

// Update props interface
interface ImageDetailModalProps {
  image: ImageData;
  isAdmin: boolean; // Add isAdmin prop
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onDetailsUpdated: (updatedImage: Partial<ImageData>) => void; // Add callback prop
  onImageDeleted: (deletedImageId: string) => void; // Add this line
}

// Define the shape of editable data (excluding src, alt, id, r2FileKey)
type EditableImageData = Pick<
  ImageData,
  "event" | "location" | "eventDate" | "photographer" | "photographerLink"
>;

// Add helper functions near the top of the file, before the component

// Function to get the end date from a possible date range string
const getEndDate = (dateString: string): Date | null => {
  if (!dateString) return null;

  // Check if it's a range (contains a hyphen)
  if (dateString.includes("-")) {
    // Extract the end date (after the hyphen)
    const endDateStr = dateString.split("-")[1].trim();
    return new Date(endDateStr);
  }

  // Not a range, just a single date
  return new Date(dateString);
};

// Function to format a date for display (handle ranges)
const formatDateDisplay = (dateString: string): string => {
  if (!dateString) return "N/A";
  return dateString.trim();
};

const ImageDetailModal: React.FC<ImageDetailModalProps> = ({
  image,
  isAdmin,
  onClose,
  onNext,
  onPrev,
  onDetailsUpdated,
  onImageDeleted,
}) => {
  // --- State for Editing ---
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<EditableImageData>({
    event: image.event,
    location: image.location,
    eventDate: image.eventDate || image.date || "", // Fall back to date for compatibility
    photographer: image.photographer,
    photographerLink: image.photographerLink,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(true);

  // Reset form data if the image prop changes (e.g., navigating with next/prev)
  useEffect(() => {
    setFormData({
      event: image.event,
      location: image.location,
      eventDate: image.eventDate || image.date || "", // Fall back to date for compatibility
      photographer: image.photographer,
      photographerLink: image.photographerLink,
    });
    setIsEditing(false); // Exit edit mode when image changes
    setError(null); // Clear errors
  }, [image]);

  // Prevent background scrolling and layout shift
  React.useEffect(() => {
    // Store original body styles
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Calculate scrollbar width
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    // Apply styles to prevent scrolling and compensate for scrollbar
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    // Cleanup function to restore original styles
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, []); // Empty dependency array ensures this runs only on mount and unmount

  // --- Handlers ---
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setError(null);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setError(null);
    // Reset form data to original image data
    setFormData({
      event: image.event,
      location: image.location,
      eventDate: image.eventDate || image.date || "", // Fall back to date for compatibility
      photographer: image.photographer,
      photographerLink: image.photographerLink,
    });
  };

  const handleSaveClick = async () => {
    setIsSaving(true);
    setError(null);
    const imageId = image.id || image.r2FileKey;
    if (!imageId) {
      setError("Cannot save changes: Image identifier is missing.");
      setIsSaving(false);
      return;
    }

    try {
      // Basic date range validation
      if (formData.eventDate && formData.eventDate.includes("-")) {
        const dateParts = formData.eventDate
          .split("-")
          .map((part: string) => part.trim());
        if (dateParts.length !== 2 || !dateParts[0] || !dateParts[1]) {
          setError("Date range format should be 'start - end'");
          setIsSaving(false);
          return;
        }

        // Optional: Add more validation for date formats here if needed
        // For example, check if both parts are valid dates
        const startDate = new Date(dateParts[0]);
        const endDate = new Date(dateParts[1]);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          setError("Invalid date format in range");
          setIsSaving(false);
          return;
        }
      }

      // API call to update image details
      const response = await fetch("/api/admin/updateimagedetails", {
        method: "POST", // Or PUT
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: imageId,
          category: image.category, // Pass category for finding collection
          updates: formData, // Send the changed form data
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Try to parse error
        throw new Error(
          errorData.error || `Failed to save details (${response.status})`
        );
      }

      const result = await response.json();

      // Call the callback to update parent state
      onDetailsUpdated({
        ...formData,
        id: image.id,
        r2FileKey: image.r2FileKey,
      });

      setIsEditing(false); // Exit edit mode on success
      console.log("Details updated successfully:", result);
      // Log the specific fields that were updated
      console.log("Updated image data:", {
        id: imageId,
        category: image.category,
        changes: {
          event:
            formData.event !== image.event
              ? { from: image.event, to: formData.event }
              : "unchanged",
          location:
            formData.location !== image.location
              ? { from: image.location, to: formData.location }
              : "unchanged",
          eventDate:
            formData.eventDate !== (image.eventDate || image.date)
              ? { from: image.eventDate || image.date, to: formData.eventDate }
              : "unchanged",
          photographer:
            formData.photographer !== image.photographer
              ? { from: image.photographer, to: formData.photographer }
              : "unchanged",
          photographerLink:
            formData.photographerLink !== image.photographerLink
              ? { from: image.photographerLink, to: formData.photographerLink }
              : "unchanged",
        },
      });

      // --- REMOVED manual revalidation fetch ---
      // The revalidateTag call in the API route handles cache invalidation.
      // The next navigation/load of the category page will automatically get fresh data.
    } catch (err: any) {
      console.error("Error saving image details:", err);
      setError(err.message || "An unknown error occurred during save.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    setError(null);
    const imageId = image.id || image.r2FileKey;

    if (!imageId) {
      setError("Cannot delete: Image identifier is missing.");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/deleteimage", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: imageId,
          category: image.category,
          r2FileKey: image.r2FileKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to delete image (${response.status})`
        );
      }

      // Call onImageDeleted with the deleted image's identifier
      onImageDeleted(imageId);

      // No need to call onClose here as onImageDeleted will handle that

      // Notify user of successful deletion (this could be via a toast notification)
      console.log("Image deleted successfully");
    } catch (err: any) {
      console.error("Error deleting image:", err);
      setError(err.message || "An unknown error occurred during deletion.");
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  // --- Toggle Details Handler ---
  const toggleDetails = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent modal close when clicking the button
    setDetailsVisible(!detailsVisible);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      // Backdrop covers entire viewport
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 "
      onClick={onClose} // Close modal on backdrop click
    >
      {/* Remove max-w-4xl and max-h-[90vh] from content, let it fill the space */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} // Adjust initial scale slightly
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 180 }} // Adjust transition
        // Make content container relative, full height/width, remove bg and rounding initially
        className="relative w-full h-full flex items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()} // Prevent backdrop click through content
      >
        {/* Image Section - takes full space */}
        <div className="relative w-full h-full flex items-center justify-center">
          {/* AnimatePresence isn't needed here if the key on motion.div changes */}
          <motion.div
            key={image.id || image.r2FileKey || image.src} // Unique key per image
            className="absolute inset-0 flex items-center justify-center" // Container for the image
            initial="initial"
            animate="animate"
            exit="exit"
            variants={{
              initial: {
                opacity: 0,
                scale: 0.95,
                filter: "blur(8px)",
              },
              animate: {
                opacity: 1,
                scale: 1,
                filter: "blur(0px)",
                transition: {
                  duration: 0.3,
                  ease: "easeOut",
                },
              },
              exit: {
                opacity: 0,
                scale: 0.98, // Optional slight scale down on exit
                // filter: "blur(4px)", // Optional blur on exit
                transition: {
                  duration: 0.2,
                  ease: "easeIn",
                },
              },
            }}
          >
            {/* Use layout="fill" and objectFit="contain" on NextImage */}
            <Image
              src={image.src}
              alt={image.alt}
              layout="fill"
              objectFit="contain" // Ensures the whole image is visible
              className="object-contain" // Redundant but safe
              priority
              quality={90}
            />
          </motion.div>
          {/* Prev/Next Buttons remain absolutely positioned */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 bg-black/40 text-white p-4 rounded-full hover:bg-black/60 transition-colors"
            aria-label="Previous image"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 md:w-8 md:h-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 bg-black/40 text-white p-4 rounded-full hover:bg-black/60 transition-colors"
            aria-label="Next image"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 md:w-8 md:h-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>

          {/* --- Toggle Details Button (Bottom Center) --- */}
          <button
            onClick={toggleDetails} // Use the handler created earlier
            className="absolute bottom-4 right-12 z-20 bg-black/40 text-white p-3 rounded-full hover:bg-black/60 transition-colors"
            aria-label={detailsVisible ? "Hide details" : "Show details"}
          >
            {detailsVisible ? (
              // Icon for hiding details (e.g., info circle with slash or similar)
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                />
              </svg>
            ) : (
              // Icon for showing details (e.g., info circle)
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                />
              </svg>
            )}
          </button>
          {/* --- End Toggle Details Button --- */}
        </div>

        {/* Details Section - Modified for Editing */}
        <AnimatePresence>
          {detailsVisible && (
            <motion.div
              className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-6 md:p-8 text-white pointer-events-none"
              initial={{ opacity: 0, y: 20 }} // Start slightly lower and faded out
              animate={{ opacity: 1, y: 0 }} // Animate to full opacity and original position
              exit={{ opacity: 0, y: 20 }} // Animate out downwards and fade
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="pointer-events-auto max-w-2xl">
                {/* Event Title - Added subtle shadow */}
                {isEditing ? (
                  <input
                    type="text"
                    name="event"
                    value={formData.event}
                    onChange={handleInputChange}
                    className="bg-neutral-800/80 border border-neutral-600 rounded px-3 py-2 text-xl md:text-2xl font-semibold mb-4 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-neutral-500"
                    placeholder="Event Name"
                  />
                ) : (
                  <h2 className="text-xl md:text-3xl font-semibold mb-4 drop-shadow-lg">
                    {formData.event}
                  </h2>
                )}

                {/* Increased spacing between detail rows */}
                <div className="space-y-3 text-sm md:text-base">
                  {/* Location - Changed label color */}
                  <div className="">
                    <p className="flex items-center">
                      <strong className="font-medium text-neutral-400 mr-3 w-32 flex-shrink-0">
                        Location:
                      </strong>
                      {isEditing ? (
                        <input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          className="input-field w-full"
                          placeholder="Location"
                        />
                      ) : (
                        <span className="text-neutral-100">
                          {formData.location}
                        </span>
                      )}
                    </p>
                  </div>
                  {/* Date - Changed label color */}
                  <div className="">
                    <p className="flex items-center">
                      <strong className="font-medium text-neutral-400 mr-3 w-32 flex-shrink-0">
                        Date:
                      </strong>
                      {isEditing ? (
                        <input
                          type="text"
                          name="eventDate"
                          value={formData.eventDate}
                          onChange={handleInputChange}
                          className="input-field w-full"
                          placeholder="M/D/YYYY or M/D/YYYY - M/D/YYYY"
                        />
                      ) : (
                        <span className="text-neutral-100">
                          {formatDateDisplay(formData.eventDate)}
                        </span>
                      )}
                    </p>
                  </div>
                  {/* Photographer - Changed label color and link color */}
                  <div className="">
                    <p className="flex items-center">
                      <strong className="font-medium text-neutral-400 mr-3 w-32 flex-shrink-0">
                        Photographer: 📸
                      </strong>
                      {isEditing ? (
                        <input
                          type="text"
                          name="photographer"
                          value={formData.photographer}
                          onChange={handleInputChange}
                          className="input-field w-full"
                          placeholder="Photographer Name"
                        />
                      ) : formData.photographerLink &&
                        formData.photographerLink !== "#" ? (
                        <Link
                          href={formData.photographerLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {formData.photographer || "Unknown"}
                        </Link>
                      ) : (
                        <span className="text-neutral-100">
                          {formData.photographer || "Unknown"}
                        </span>
                      )}
                    </p>
                  </div>
                  {/* Photographer Link - Only visible in edit mode */}
                  {isEditing && (
                    <div className="">
                      <p className="flex items-center">
                        <strong className="font-medium text-nowrap text-neutral-400 mr-3 w-38 flex-shrink-0">
                          Photograhper URL:
                        </strong>
                        <input
                          type="text"
                          name="photographerLink"
                          value={formData.photographerLink}
                          onChange={handleInputChange}
                          className="input-field w-full"
                          placeholder="https://..."
                        />
                      </p>
                    </div>
                  )}
                </div>

                {/* Edit/Save/Cancel Buttons & Error Message */}
                {isAdmin && (
                  <div className="mt-6 flex items-center gap-3">
                    {!isEditing ? (
                      <button onClick={handleEditClick} className="edit-btn">
                        Edit Details
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleSaveClick}
                          disabled={isSaving || isDeleting}
                          className="save-btn"
                        >
                          {isSaving ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                          onClick={handleCancelClick}
                          disabled={isSaving || isDeleting}
                          className="cancel-btn"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDeleteClick}
                          disabled={isSaving || isDeleting}
                          className="delete-btn"
                        >
                          Delete Image
                        </button>
                      </>
                    )}
                  </div>
                )}
                {error && (
                  <p className="text-red-500 text-sm mt-3">Error: {error}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Close Button - Increase padding for larger click area */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 md:top-4 md:right-4 z-20 bg-black/40 text-white p-4 rounded-full hover:bg-black/60 transition-colors"
          aria-label="Close modal"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>

        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/90 z-30 flex items-center justify-center p-4">
            <div className="bg-neutral-800 p-6 rounded-lg max-w-md w-full">
              <h3 className="text-xl font-bold text-white mb-4">
                Confirm Deletion
              </h3>
              <p className="text-neutral-300 mb-6">
                Are you sure you want to delete this image? This action cannot
                be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm bg-neutral-700 hover:bg-neutral-600 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 rounded-md text-white"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

// Add some basic reusable styles (adjust as needed)
const InputFieldStyles =
  "bg-neutral-700/60 border border-neutral-500 rounded px-3 py-1.5 text-sm md:text-base w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none placeholder-neutral-500 disabled:opacity-60 transition-colors duration-150";
const BaseButtonStyles =
  "px-4 py-1.5 text-xs font-medium rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/50 disabled:opacity-60 transition-all duration-150 ease-in-out";
const EditButtonStyles = `${BaseButtonStyles} bg-blue-600 hover:bg-blue-500 text-white focus:ring-blue-500`;
const SaveButtonStyles = `${BaseButtonStyles} bg-green-600 hover:bg-green-500 text-white focus:ring-green-500`;
const CancelButtonStyles = `${BaseButtonStyles} bg-neutral-600 hover:bg-neutral-500 text-neutral-100 focus:ring-neutral-500`;
const DeleteButtonStyles = `${BaseButtonStyles} bg-red-700 hover:bg-red-600 text-white focus:ring-red-600`;

// Helper component or apply styles directly
// You might want to extract styles to a CSS module
const applyStyles = () => {
  if (typeof window !== "undefined") {
    const styleId = "image-detail-modal-styles";
    // Prevent adding styles multiple times if component re-renders
    if (document.getElementById(styleId)) return;

    const styleSheet = document.createElement("style");
    styleSheet.id = styleId;
    styleSheet.type = "text/css";
    styleSheet.innerText = `
          .input-field { @apply ${InputFieldStyles}; }
          .edit-btn { @apply ${EditButtonStyles}; }
          .save-btn { @apply ${SaveButtonStyles}; }
          .cancel-btn { @apply ${CancelButtonStyles}; }
          .delete-btn { @apply ${DeleteButtonStyles}; }
      `;
    document.head.appendChild(styleSheet);
  }
};
applyStyles(); // Apply styles on module load

export default ImageDetailModal;
