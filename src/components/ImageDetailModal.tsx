import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

// Define the same ImageData interface or import it
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
}

// Define the shape of editable data (excluding src, alt, id, r2FileKey)
type EditableImageData = Pick<
  ImageData,
  "event" | "location" | "date" | "photographer" | "photographerLink"
>;

const ImageDetailModal: React.FC<ImageDetailModalProps> = ({
  image,
  isAdmin,
  onClose,
  onNext,
  onPrev,
  onDetailsUpdated,
}) => {
  // --- State for Editing ---
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<EditableImageData>({
    event: image.event,
    location: image.location,
    date: image.date, // Consider using a date input type later
    photographer: image.photographer,
    photographerLink: image.photographerLink,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form data if the image prop changes (e.g., navigating with next/prev)
  useEffect(() => {
    setFormData({
      event: image.event,
      location: image.location,
      date: image.date,
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
      date: image.date,
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
      // TODO: Implement this API endpoint
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
    } catch (err: any) {
      console.error("Error saving image details:", err);
      setError(err.message || "An unknown error occurred during save.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      // Backdrop covers entire viewport
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 md:p-4"
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
        </div>

        {/* Details Section - Modified for Editing */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-4 md:p-6 text-white pointer-events-none">
          <div className="pointer-events-auto max-w-xl">
            {/* Event */}
            {isEditing ? (
              <input
                type="text"
                name="event"
                value={formData.event}
                onChange={handleInputChange}
                className="bg-neutral-800/80 border border-neutral-600 rounded px-2 py-1 text-xl md:text-2xl font-semibold mb-2 w-full focus:ring-1 focus:ring-blue-500 focus:outline-none"
                placeholder="Event Name"
              />
            ) : (
              <h2 className="text-xl md:text-2xl font-semibold mb-2 drop-shadow-md">
                {formData.event}
              </h2>
            )}

            <div className="space-y-2 text-sm md:text-base opacity-90">
              {/* Location */}
              <p className="flex items-center">
                <strong className="font-medium text-neutral-300 mr-2 w-24 flex-shrink-0">
                  Location:
                </strong>
                {isEditing ? (
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Location"
                  />
                ) : (
                  <span>{formData.location}</span>
                )}
              </p>
              {/* Date */}
              <p className="flex items-center">
                <strong className="font-medium text-neutral-300 mr-2 w-24 flex-shrink-0">
                  Date:
                </strong>
                {isEditing ? (
                  <input
                    type="text"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Date (e.g., YYYY-MM-DD)"
                  />
                ) : (
                  /* Consider type="date" */
                  <span>{formData.date}</span>
                )}
              </p>
              {/* Photographer */}
              <p className="flex items-center">
                <strong className="font-medium text-neutral-300 mr-2 w-24 flex-shrink-0">
                  Photographer:
                </strong>
                {isEditing ? (
                  <input
                    type="text"
                    name="photographer"
                    value={formData.photographer}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Photographer Name"
                  />
                ) : (
                  <span>{formData.photographer}</span>
                )}
              </p>
              {/* Photographer Link */}
              <p className="flex items-center">
                <strong className="font-medium text-neutral-300 mr-2 w-24 flex-shrink-0">
                  Photog Link:
                </strong>
                {isEditing ? (
                  <input
                    type="text"
                    name="photographerLink"
                    value={formData.photographerLink}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="https://..."
                  />
                ) : formData.photographerLink &&
                  formData.photographerLink !== "#" ? (
                  <Link
                    href={formData.photographerLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-neutral-100 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {formData.photographerLink}
                  </Link>
                ) : (
                  <span className="text-neutral-500 italic">N/A</span>
                )}
              </p>
            </div>

            {/* Edit/Save/Cancel Buttons & Error Message */}
            {isAdmin && (
              <div className="mt-4 flex items-center gap-3">
                {!isEditing ? (
                  <button onClick={handleEditClick} className="edit-btn">
                    Edit Details
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSaveClick}
                      disabled={isSaving}
                      className="save-btn"
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      onClick={handleCancelClick}
                      disabled={isSaving}
                      className="cancel-btn"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            )}
            {error && (
              <p className="text-red-500 text-xs mt-2">Error: {error}</p>
            )}
          </div>
        </div>

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
      </motion.div>
    </motion.div>
  );
};

// Add some basic reusable styles (adjust as needed)
const InputFieldStyles =
  "bg-neutral-800/80 border border-neutral-600 rounded px-2 py-1 text-sm md:text-base w-full focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:opacity-50";
const EditButtonStyles =
  "px-3 py-1 text-xs rounded bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50";
const SaveButtonStyles =
  "px-3 py-1 text-xs rounded bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50";
const CancelButtonStyles =
  "px-3 py-1 text-xs rounded bg-neutral-600 hover:bg-neutral-700 transition-colors disabled:opacity-50";

// Helper component or apply styles directly
// You might want to extract styles to a CSS module
const applyStyles = () => {
  if (typeof window !== "undefined") {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = `
          .input-field { @apply ${InputFieldStyles}; }
          .edit-btn { @apply ${EditButtonStyles}; }
          .save-btn { @apply ${SaveButtonStyles}; }
          .cancel-btn { @apply ${CancelButtonStyles}; }
      `;
    document.head.appendChild(styleSheet);
  }
};
applyStyles(); // Apply styles on module load

export default ImageDetailModal;
