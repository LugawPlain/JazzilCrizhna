import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar as CalendarIcon, X as XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Define the same ImageData interface or import it
interface ImageData {
  src: string;
  alt: string;
  date?: string; // Keep for backward compatibility
  eventDate: string; // Add the eventDate field
  photographer: string;
  photographerLink: string;
  location: string;
  locationLink: string;
  event: string;
  eventLink: string;
  advertising: string;
  advertisingLink?: string | null;
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
  | "event"
  | "eventLink"
  | "location"
  | "locationLink"
  | "eventDate"
  | "photographer"
  | "photographerLink"
  | "advertising"
  | "advertisingLink"
>;

// Add helper functions near the top of the file, before the component

// Function to get the end date from a possible date range string

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
    locationLink: image.locationLink,
    eventDate: image.eventDate || "",
    eventLink: image.eventLink,
    photographer: image.photographer,
    photographerLink: image.photographerLink,
    advertising: image.advertising,
    advertisingLink: image.advertisingLink || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(true);

  // State for date pickers in edit mode
  const [editStartDate, setEditStartDate] = useState<Date | undefined>();
  const [editEndDate, setEditEndDate] = useState<Date | undefined>();
  const [showEditEndDate, setShowEditEndDate] = useState(false);

  // Reset form data if the image prop changes (e.g., navigating with next/prev)
  useEffect(() => {
    setFormData({
      event: image.event,
      location: image.location,
      locationLink: image.locationLink,
      eventLink: image.eventLink,
      eventDate: image.eventDate || "", // Fall back to date for compatibility
      photographer: image.photographer,
      photographerLink: image.photographerLink,
      advertising: image.advertising,
      advertisingLink: image.advertisingLink || "",
    });
    setError(null); // Clear errors
    // Also reset date picker states if image changes WHILE editing
    // This ensures the date picker reflects the *new* image's date
    // Parse existing eventDate to populate date pickers
    const currentDate = image.eventDate || image.date || ""; // Use new image data directly
    if (currentDate.includes(" - ")) {
      const parts = currentDate.split(" - ");
      const start = new Date(parts[0].trim());
      const end = new Date(parts[1].trim());
      setEditStartDate(!isNaN(start.getTime()) ? start : undefined);
      if (!isNaN(end.getTime())) {
        setEditEndDate(end);
        setShowEditEndDate(true);
      } else {
        setEditEndDate(undefined);
        setShowEditEndDate(false);
      }
    } else if (currentDate) {
      const start = new Date(currentDate.trim());
      setEditStartDate(!isNaN(start.getTime()) ? start : undefined);
      setEditEndDate(undefined);
      setShowEditEndDate(false);
    } else {
      setEditStartDate(undefined);
      setEditEndDate(undefined);
      setShowEditEndDate(false);
    }
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
    // Parse existing eventDate to populate date pickers
    const currentDate = formData.eventDate || image.date || "";
    if (currentDate.includes(" - ")) {
      const parts = currentDate.split(" - ");
      const start = new Date(parts[0].trim());
      const end = new Date(parts[1].trim());
      if (!isNaN(start.getTime())) {
        setEditStartDate(start);
      }
      if (!isNaN(end.getTime())) {
        setEditEndDate(end);
        setShowEditEndDate(true);
      } else {
        setShowEditEndDate(false); // Hide if end date is invalid
      }
    } else if (currentDate) {
      const start = new Date(currentDate.trim());
      if (!isNaN(start.getTime())) {
        setEditStartDate(start);
      }
      setEditEndDate(undefined);
      setShowEditEndDate(false);
    } else {
      // No date initially, clear pickers
      setEditStartDate(undefined);
      setEditEndDate(undefined);
      setShowEditEndDate(false);
    }
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setError(null);
    // Reset form data to original image data
    setFormData({
      event: image.event,
      location: image.location,
      locationLink: image.locationLink,
      eventDate: image.eventDate || image.date || "", // Fall back to date for compatibility
      eventLink: image.eventLink,
      photographer: image.photographer,
      photographerLink: image.photographerLink,
      advertising: image.advertising,
      advertisingLink: image.advertisingLink || "",
    });
    // Also reset date picker states (redundant due to useEffect, but good practice)
    setEditStartDate(undefined);
    setEditEndDate(undefined);
    setShowEditEndDate(false);
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

    // --- START: Format date from pickers into string ---
    let formattedDateString = "";
    if (editStartDate) {
      formattedDateString = format(editStartDate, "M/d/yyyy");
      if (showEditEndDate && editEndDate) {
        formattedDateString += ` - ${format(editEndDate, "M/d/yyyy")}`;
      }
    }
    // Update formData right before sending
    const dataToSend = { ...formData, eventDate: formattedDateString };
    // --- END: Format date from pickers into string ---

    try {
      // API call to update image details
      const response = await fetch("/api/admin/updateimagedetails", {
        method: "POST", // Or PUT
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: imageId,
          category: image.category, // Pass category for finding collection
          updates: dataToSend, // Send the data with the formatted date
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
        ...dataToSend,
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
            dataToSend.event !== image.event
              ? { from: image.event, to: dataToSend.event }
              : "unchanged",
          eventLink:
            dataToSend.eventLink !== image.eventLink
              ? { from: image.eventLink, to: dataToSend.eventLink }
              : "unchanged",
          location:
            dataToSend.location !== image.location
              ? { from: image.location, to: dataToSend.location }
              : "unchanged",
          locationLink:
            dataToSend.locationLink !== image.locationLink
              ? { from: image.locationLink, to: dataToSend.locationLink }
              : "unchanged",
          eventDate:
            dataToSend.eventDate !== (image.eventDate || image.date)
              ? {
                  from: image.eventDate || image.date,
                  to: dataToSend.eventDate,
                }
              : "unchanged",
          photographer:
            dataToSend.photographer !== image.photographer
              ? { from: image.photographer, to: dataToSend.photographer }
              : "unchanged",
          photographerLink:
            dataToSend.photographerLink !== image.photographerLink
              ? {
                  from: image.photographerLink,
                  to: dataToSend.photographerLink,
                }
              : "unchanged",
          advertising:
            dataToSend.advertising !== image.advertising
              ? { from: image.advertising, to: dataToSend.advertising }
              : "unchanged",
          advertisingLink:
            dataToSend.advertisingLink !== (image.advertisingLink || "")
              ? {
                  from: image.advertisingLink || "",
                  to: dataToSend.advertisingLink,
                }
              : "unchanged",
        },
      });

      // --- REMOVED manual revalidation fetch ---
      // The revalidateTag call in the API route handles cache invalidation.
      // The next navigation/load of the category page will automatically get fresh data.
    } catch (err: unknown) {
      console.error("Error saving image details:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An unknown error occurred during save."
      );
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
    } catch (err: unknown) {
      console.error("Error deleting image:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An unknown error occurred during deletion."
      );
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

          {/* --- End Toggle Details Button --- */}
        </div>

        {/* Details Section - Modified for Editing */}
        <motion.div
          className={`absolute bottom-0 px-8 pb-8 left-0 right-0 z-10 bg-gradient-to-t from-black/90 via-black/70 to-black/2 text-white transition-all duration-500 ease-in-out ${
            detailsVisible ? "" : "translate-y-full"
          }`}
        >
          <button
            onClick={toggleDetails}
            className={` ${
              detailsVisible ? "rotate-0" : "-rotate-180 "
            } absolute top-0 left-1/2 -translate-y-3/4 transition-transform duration-500 ease-in-out -translate-x-1/2 z-30 bg-black/40 text-white p-3 rounded-full hover:bg-black/60 focus:outline-none`}
            aria-label={detailsVisible ? "Hide details" : "Show details"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              {/* Adjusted icon to be more like a chevron down for "hide" */}
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>

          <div
            className={`pointer-events-auto max-w-2xl pt-10 transition-opacity duration-300`}
          >
            <>
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
                  {formData.eventLink && formData.eventLink !== "#" ? (
                    <Link
                      href={formData.eventLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                      onClick={(e) => e.stopPropagation()} // Prevent modal close
                    >
                      {formData.event}
                    </Link>
                  ) : (
                    formData.event // Display text if no link
                  )}
                </h2>
              )}
              {/* Event Link Input (Edit Mode) */}
              {isEditing && (
                <div className="mb-2">
                  {" "}
                  {/* Add some margin below */}
                  <p className="flex items-center">
                    <strong className="font-medium text-nowrap text-neutral-400 mr-3 w-34 flex-shrink-0">
                      Event URL:
                    </strong>
                    <input
                      type="url"
                      name="eventLink"
                      value={formData.eventLink || ""} // Ensure value is controlled
                      onChange={handleInputChange}
                      className="input-field w-full"
                      placeholder="https://... (Event link)"
                    />
                  </p>
                </div>
              )}
              {/* Increased spacing between detail rows */}
              <div className="space-y-3 text-sm md:text-base">
                {/* Location - Changed label color */}
                <div className="">
                  <p className="flex items-center">
                    <strong className="font-medium text-neutral-400 mr-3 w-34 flex-shrink-0">
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
                        {formData.locationLink &&
                        formData.locationLink !== "#" ? (
                          <Link
                            href={formData.locationLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                            onClick={(e) => e.stopPropagation()} // Prevent modal close
                          >
                            {formData.location}
                          </Link>
                        ) : (
                          formData.location // Display text if no link
                        )}
                      </span>
                    )}
                  </p>
                </div>
                {/* Location Link Input (Edit Mode) */}
                {isEditing && (
                  <div className="">
                    <p className="flex items-center">
                      <strong className="font-medium text-nowrap text-neutral-400 mr-3 w-34 flex-shrink-0">
                        Location URL:
                      </strong>
                      <input
                        type="url"
                        name="locationLink"
                        value={formData.locationLink || ""} // Ensure value is controlled
                        onChange={handleInputChange}
                        className="input-field w-full"
                        placeholder="https://... (Location link)"
                      />
                    </p>
                  </div>
                )}
                {/* Date - Changed label color */}
                <div className="">
                  <div className="flex items-center">
                    <strong className="font-medium text-neutral-400 mr-3 w-34 flex-shrink-0">
                      Date:
                    </strong>
                    {isEditing ? (
                      // --- START: Date Picker Replacement ---
                      <div className="flex flex-col  gap-2 items-start w-full">
                        {/* Start Date Picker */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal h-auto py-1.5 px-3 text-sm md:text-base bg-neutral-700/60 border-neutral-500 hover:bg-neutral-700 hover:text-white",
                                !editStartDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {editStartDate ? (
                                format(editStartDate, "P")
                              ) : (
                                <span>Pick a start date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-auto p-0 z-[110]"
                            align="start"
                          >
                            <Calendar
                              mode="single"
                              selected={editStartDate}
                              onSelect={(date) => {
                                setEditStartDate(date);
                                // Ensure end date is not before start date
                                if (editEndDate && date && date > editEndDate) {
                                  setEditEndDate(undefined);
                                  setShowEditEndDate(false); // Optionally hide end date if start goes past it
                                }
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>

                        {/* Add/Remove End Date Button */}

                        {/* End Date Picker (Conditional) */}
                        {showEditEndDate && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal h-auto py-1.5 px-3 text-sm md:text-base bg-neutral-700/60 border-neutral-500 hover:bg-neutral-700 hover:text-white",
                                  !editEndDate && "text-muted-foreground"
                                )}
                                disabled={!editStartDate}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {editEndDate ? (
                                  format(editEndDate, "P")
                                ) : (
                                  <span>Pick an end date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0 z-[110]"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={editEndDate}
                                onSelect={setEditEndDate}
                                disabled={(date) =>
                                  editStartDate ? date < editStartDate : false
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    ) : (
                      // --- END: Date Picker Replacement ---
                      <span className="text-neutral-100">
                        {formatDateDisplay(formData.eventDate)}
                      </span>
                    )}
                    {/* Conditionally render the button only when editing */}
                    {isEditing && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="p-1 h-auto text-xs text-neutral-400 hover:text-white hover:bg-neutral-700 flex-shrink-0"
                        onClick={() => {
                          if (showEditEndDate) {
                            setEditEndDate(undefined);
                          }
                          setShowEditEndDate(!showEditEndDate);
                        }}
                      >
                        {showEditEndDate ? (
                          <XIcon className="h-4 w-4 mr-1" />
                        ) : (
                          <CalendarIcon className="h-4 w-4 mr-1" />
                        )}
                        {showEditEndDate ? "Remove End Date" : "Add End Date"}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Photographer - Changed label color and link color */}
                <div className="">
                  <p className="flex items-center">
                    <strong className="font-medium text-neutral-400 mr-3 w-34 flex-shrink-0">
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
                        className=" underline transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {formData.photographer || "Unknown"} ↗
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
                {/* Advertising Display */}
                {!isEditing && formData.advertising && (
                  <p className="flex items-center">
                    <strong className="font-medium text-neutral-400 mr-3 w-34 flex-shrink-0">
                      Advertising:
                    </strong>
                    <span className="text-neutral-100">
                      {formData.advertising}
                    </span>
                  </p>
                )}
                {/* Advertising Input (Edit Mode) */}
                {isEditing && (
                  <div className="">
                    <p className="flex items-center">
                      <strong className="font-medium text-nowrap text-neutral-400 mr-3 w-34 flex-shrink-0">
                        Advertising:
                      </strong>
                      <input
                        type="text"
                        name="advertising"
                        value={formData.advertising || ""}
                        onChange={handleInputChange}
                        className="input-field w-full"
                        placeholder="Advertising Info"
                      />
                    </p>
                  </div>
                )}
                {/* Advertising Link Display */}
                {formData.advertisingLink && !isEditing && (
                  <p className="flex items-center">
                    <strong className="font-medium text-neutral-400 mr-3 w-34 flex-shrink-0">
                      Ad Link:
                    </strong>
                    <Link
                      href={formData.advertisingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline truncate transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {formData.advertisingLink}
                    </Link>
                  </p>
                )}
                {/* Advertising Link Input (Edit Mode) */}
                {isEditing && (
                  <div className="">
                    <p className="flex items-center">
                      <strong className="font-medium text-nowrap text-neutral-400 mr-3 w-34 flex-shrink-0">
                        Ad Link:
                      </strong>
                      <input
                        type="url"
                        name="advertisingLink"
                        value={formData.advertisingLink || ""}
                        onChange={handleInputChange}
                        className="input-field w-full"
                        placeholder="https://... (Ad link)"
                      />
                    </p>
                  </div>
                )}
              </div>
            </>
            {isAdmin && (
              <div className="mt-6 flex items-center gap-3">
                {!isEditing ? (
                  <Button onClick={handleEditClick} size="sm">
                    Edit Details
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleSaveClick}
                      disabled={isSaving || isDeleting}
                      size="sm"
                      variant="default"
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      onClick={handleCancelClick}
                      disabled={isSaving || isDeleting}
                      size="sm"
                      variant="secondary"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleDeleteClick}
                      disabled={isSaving || isDeleting}
                      size="sm"
                      variant="destructive"
                    >
                      Delete Image
                    </Button>
                  </>
                )}
              </div>
            )}
            {error && (
              <p className="text-red-500 text-sm mt-3">Error: {error}</p>
            )}
          </div>
        </motion.div>

        {/* Close Button - Increase padding for larger click area */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-red-400 md:top-4 md:right-4 z-20 bg-black/40  p-4 rounded-full hover:bg-black/60 transition-colors"
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

export default ImageDetailModal;
