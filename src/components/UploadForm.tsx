"use client";
import React, { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, X as XIcon } from "lucide-react";

import { cn } from "@/lib/utils"; // Assuming you have this utility function
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import MetadataEditModal from "./MetadataEditModal"; // Import the modal
// import { db, storage } from "../lib/firebase"; // Commented out
// import { collection, addDoc, serverTimestamp } from "firebase/firestore"; // Commented out
// import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"; // Commented out

// Define a type for individual file metadata
interface FileMetadata {
  id: string; // Use a unique ID, maybe based on file name + index
  photographer: string;
  photographerLink: string; // Added field for photographer's link
  event: string;
  eventLink: string;
  eventDate: string; // Keep as string for final data structure if backend expects it
  location: string; // Added location state
  locationLink: string;
  advertising: string;
  advertisingLink: string; // <-- Add advertising link
  previewUrl: string;
  file: File; // Keep the original file object associated
}

// Define a type for the global default values used in applyGlobalDefaults
interface GlobalMetadataDefaults {
  globalPhotographer: string;
  globalPhotographerLink: string;
  globalEvent: string;
  globalEventLink: string;
  globalEventDate: string; // Keep as string matching FileMetadata
  globalLocation: string;
  globalLocationLink: string;
  globalAdvertising: string;
  globalAdvertisingLink: string;
}

// Helper function to apply global defaults to specific metadata
const applyGlobalDefaults = (
  specific: Omit<FileMetadata, "id" | "previewUrl" | "file">,
  globals: GlobalMetadataDefaults
): Omit<FileMetadata, "id" | "previewUrl" | "file"> => {
  const updated = { ...specific }; // Create a copy to avoid mutating the original

  if (updated.photographer === "") {
    updated.photographer = globals.globalPhotographer;
  }
  if (updated.photographerLink === "") {
    updated.photographerLink = globals.globalPhotographerLink;
  }
  if (updated.event === "") {
    updated.event = globals.globalEvent;
  }
  if (updated.eventLink === "") {
    updated.eventLink = globals.globalEventLink;
  }
  // Event date: Apply default string if specific string is empty
  if (updated.eventDate === "") {
    updated.eventDate = globals.globalEventDate;
  }
  if (updated.location === "") {
    updated.location = globals.globalLocation;
  }
  if (updated.locationLink === "") {
    updated.locationLink = globals.globalLocationLink;
  }
  if (updated.advertising === "") {
    updated.advertising = globals.globalAdvertising;
  }
  if (updated.advertisingLink === "") {
    updated.advertisingLink = globals.globalAdvertisingLink;
  }

  return updated;
};

function UploadForm() {
  // --- Global State ---
  // Restore separate date states & showEndDate flag
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [showEndDate, setShowEndDate] = useState<boolean>(false);
  // Keep other global states
  const [globalLocation, setGlobalLocation] = useState("");
  const [globalLocationLink, setGlobalLocationLink] = useState("");
  const [globalPhotographer, setGlobalPhotographer] = useState("");
  const [globalPhotographerLink, setGlobalPhotographerLink] = useState("");
  const [globalEventLink, setGlobalEventLink] = useState("");
  const [globalAdvertising, setGlobalAdvertising] = useState("");
  const [globalAdvertisingLink, setGlobalAdvertisingLink] = useState("");
  const [globalCategory, setGlobalCategory] = useState("");
  const [globalEvent, setGlobalEvent] = useState("");

  // --- File & Upload State ---
  const [filesWithMetadata, setFilesWithMetadata] = useState<FileMetadata[]>(
    []
  );
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // --- Modal State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  // --- Categories ---
  const categories = [
    "PAGEANT",
    "MODELING",
    "ADVERTISING",
    "CLOTHING",
    "MUSE",
    "PHOTOSHOOT",
    "COSPLAY",
    "OTHERS",
  ];

  // --- Cleanup Object URLs ---
  useEffect(() => {
    return () => {
      filesWithMetadata.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [filesWithMetadata]);

  // --- File Handling ---
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setError(null);
      setSuccess(false);
      setSuccessMessage("");
      filesWithMetadata.forEach((item) => URL.revokeObjectURL(item.previewUrl));

      const selectedFiles = Array.from(e.target.files);
      const newFilesWithMetadata: FileMetadata[] = selectedFiles.map(
        (file, index) => {
          const previewUrl = URL.createObjectURL(file);
          const id = `${file.name}-${index}-${Date.now()}`;
          return {
            id,
            file,
            previewUrl,
            photographer: "",
            photographerLink: "",
            event: "",
            eventLink: "",
            eventDate: "", // Initialize eventDate as empty string
            location: "",
            locationLink: "",
            advertising: "",
            advertisingLink: "",
          };
        }
      );
      setFilesWithMetadata(newFilesWithMetadata);
    }
  };

  // --- API Response Type ---
  interface UploadedFileResult {
    originalFilename: string;
    fileKey: string;
    firestoreDocId: string;
  }

  // --- Form Submission ---
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (filesWithMetadata.length === 0) {
      setError("Please select at least one image.");
      return;
    }
    if (!globalCategory) {
      setError("Please select a category.");
      return;
    }

    // If start date IS required globally, add this check:
    // if (!startDate) {
    //   setError("Please select a start date.");
    //   return;
    // }

    setIsUploading(true);
    setError(null);
    setSuccess(false);
    setSuccessMessage("");

    // --- Prepare Metadata ---
    // Format the selected date(s) into the string format
    let formattedGlobalEventDate = "";
    if (startDate) {
      formattedGlobalEventDate = format(startDate, "MM/dd/yyyy");
      // Append end date only if it's shown and selected
      if (showEndDate && endDate) {
        // Ensure end date is not before start date (Calendar prop handles selection, but double-check)
        if (endDate >= startDate) {
          formattedGlobalEventDate += ` - ${format(endDate, "MM/dd/yyyy")}`;
        } else {
          // Handle case where somehow end date is before start date (e.g., log warning)
          console.warn(
            "End date is before start date, submitting start date only."
          );
        }
      }
    }

    const finalMetadata = filesWithMetadata.map((item) => {
      const specificMetadata = {
        photographer: item.photographer,
        photographerLink: item.photographerLink,
        event: item.event,
        eventLink: item.eventLink,
        eventDate: item.eventDate, // Start with the item's specific date string
        location: item.location,
        locationLink: item.locationLink,
        advertising: item.advertising,
        advertisingLink: item.advertisingLink,
        originalFilename: item.file.name,
      };

      const globalDefaults: GlobalMetadataDefaults = {
        globalPhotographer,
        globalPhotographerLink,
        globalEvent,
        globalEventLink,
        globalEventDate: formattedGlobalEventDate, // Use formatted date string as default
        globalLocation,
        globalLocationLink,
        globalAdvertising,
        globalAdvertisingLink,
      };

      const metadataWithDefaults = applyGlobalDefaults(
        {
          photographer: specificMetadata.photographer,
          photographerLink: specificMetadata.photographerLink,
          eventDate: specificMetadata.eventDate,
          location: specificMetadata.location,
          event: specificMetadata.event,
          eventLink: specificMetadata.eventLink,
          locationLink: specificMetadata.locationLink,
          advertising: specificMetadata.advertising,
          advertisingLink: specificMetadata.advertisingLink,
        },
        globalDefaults
      );

      const finalItemMetadata = {
        ...metadataWithDefaults,
        originalFilename: specificMetadata.originalFilename,
      };

      console.log("Final metadata after applying defaults:", finalItemMetadata);
      return finalItemMetadata;
    });

    // --- Create FormData ---
    const formData = new FormData();
    filesWithMetadata.forEach((item) => {
      formData.append(`file`, item.file);
    });
    if (globalCategory) {
      formData.append("category", globalCategory);
    } else {
      setError("Category is missing.");
      setIsUploading(false);
      return;
    }
    formData.append("metadataArray", JSON.stringify(finalMetadata));

    // --- Send Request ---
    try {
      console.log("Submitting FormData:");
      console.log("Metadata Array:", finalMetadata);
      const response = await fetch("/api/admin/uploadimages", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }
      const result = await response.json();
      console.log("Upload API response:", result);

      // Log success
      if (
        result.results &&
        Array.isArray(result.results) &&
        result.results.length > 0
      ) {
        result.results.forEach((uploadedFile: UploadedFileResult) => {
          console.log(`Uploaded file: ${uploadedFile.originalFilename}`);
          console.log(`File key: ${uploadedFile.fileKey}`);
          console.log(`Firestore doc ID: ${uploadedFile.firestoreDocId}`);
        });
      }
      const metadataLog = finalMetadata.map((metadata) => ({
        file: metadata.originalFilename,
        eventDate: metadata.eventDate,
        photographer: metadata.photographer,
        photographerLink: metadata.photographerLink,
        location: metadata.location,
        locationLink: metadata.locationLink,
        event: metadata.event,
        eventLink: metadata.eventLink,
        advertising: metadata.advertising,
        advertisingLink: metadata.advertisingLink,
      }));
      console.log("Files uploaded with the following metadata:");
      console.table(metadataLog);

      setSuccess(true);
      setSuccessMessage(
        result.message ||
          `${
            result.count || filesWithMetadata.length
          } file(s) uploaded successfully!`
      );

      // --- Reset State ---
      setFilesWithMetadata([]);
      setStartDate(undefined); // Reset start date
      setEndDate(undefined); // Reset end date
      setShowEndDate(false); // Hide end date picker
      setGlobalLocation("");
      setGlobalLocationLink("");
      setGlobalPhotographer("");
      setGlobalPhotographerLink("");
      setGlobalEvent("");
      setGlobalEventLink("");
      setGlobalAdvertising("");
      setGlobalAdvertisingLink("");
      setGlobalCategory("");

      const fileInput = document.getElementById(
        "fileInput"
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (err: unknown) {
      console.error("Upload failed:", err);
      let errorMessage = "An unknown upload error occurred.";
      if (err instanceof Error) {
        errorMessage = `Upload failed: ${err.message}`;
      } else if (typeof err === "string") {
        errorMessage = `Upload failed: ${err}`;
      }
      setError(errorMessage);
      setSuccess(false);
      setSuccessMessage("");
    } finally {
      setIsUploading(false);
    }
  };

  // --- Metadata Modal Save Handler ---
  // Maintaining the fix based on original linter error
  const handleSaveMetadata = (
    id: string,
    updatedMetadata: Pick<
      FileMetadata,
      | "photographer"
      | "photographerLink"
      | "eventDate"
      | "location"
      | "locationLink"
      | "event"
      | "eventLink"
      | "advertising"
      | "advertisingLink"
    >
  ) => {
    console.log("Saving metadata for file:", id);
    console.log("Updated metadata from modal:", updatedMetadata);

    setFilesWithMetadata((prevFiles) => {
      const updatedFiles = prevFiles.map((file) =>
        file.id === id ? { ...file, ...updatedMetadata } : file
      );

      const updatedFile = updatedFiles.find((f) => f.id === id);
      console.log("File after metadata update:", {
        id: updatedFile?.id,
        photographer: updatedFile?.photographer,
        photographerLink: updatedFile?.photographerLink,
        eventDate: updatedFile?.eventDate,
        location: updatedFile?.location,
        locationLink: updatedFile?.locationLink,
        event: updatedFile?.event,
        eventLink: updatedFile?.eventLink,
        advertising: updatedFile?.advertising,
        advertisingLink: updatedFile?.advertisingLink,
        fileName: updatedFile?.file.name,
      });

      return updatedFiles;
    });
  };

  // --- Find the selected file for the modal ---
  const selectedFileForModal = filesWithMetadata.find(
    (f) => f.id === selectedFileId
  );

  // --- Prepare Modal Data ---
  // Maintaining the fix based on original linter error
  const modalPropsData = selectedFileForModal
    ? {
        id: selectedFileForModal.id,
        file: selectedFileForModal.file,
        currentMetadata: {
          photographer: selectedFileForModal.photographer,
          photographerLink: selectedFileForModal.photographerLink,
          eventDate: selectedFileForModal.eventDate,
          location: selectedFileForModal.location,
          locationLink: selectedFileForModal.locationLink, // Excluded
          event: selectedFileForModal.event,
          eventLink: selectedFileForModal.eventLink, // Excluded
          advertising: selectedFileForModal.advertising, // Excluded
          advertisingLink: selectedFileForModal.advertisingLink,
        },
      }
    : null;

  // --- Date Picker UI Handlers ---
  const handleUpToClick = () => {
    setShowEndDate(true);
    // Optionally set end date to start date if start date exists
    if (startDate && !endDate) {
      setEndDate(startDate);
    }
  };

  const handleRemoveEndDate = () => {
    setShowEndDate(false);
    setEndDate(undefined);
  };

  return (
    // --- Main Flex Container ---
    <div className="flex flex-col md:flex-row gap-6 p-4 md:p-8 min-h-screen mt-24">
      {/* --- Left Column: Form --- */}
      <div className="w-full md:w-2/5 lg:w-1/3 p-6 bg-white rounded-lg shadow-md self-start">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Upload New Photos
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        {success && successMessage && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Input */}
          <div className="space-y-2">
            <label
              htmlFor="fileInput"
              className="block text-sm font-medium text-gray-700"
            >
              Photo:
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="fileInput"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="fileInput"
                      type="file"
                      className="sr-only"
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      required
                      multiple
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">Images or Videos</p>
              </div>
            </div>
          </div>

          {/* --- Date Picker Section --- */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date(s) Taken: (Optional)
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {/* Start Date Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[200px] justify-start text-left font-normal", // Adjusted width
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? (
                      format(startDate, "MM/dd/yyyy")
                    ) : (
                      <span>Start date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    // Optionally disable future dates: disabled={{ after: new Date() }}
                  />
                </PopoverContent>
              </Popover>

              {/* End Date Picker OR Add Button */}
              {showEndDate ? (
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">-</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[200px] justify-start text-left font-normal", // Adjusted width
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? (
                          format(endDate, "MM/dd/yyyy")
                        ) : (
                          <span>End date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={startDate ? { before: startDate } : undefined}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {/* Remove End Date Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveEndDate}
                    className="h-8 w-8 p-0"
                  >
                    <XIcon className="h-4 w-4" />
                    <span className="sr-only">Remove end date</span>
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUpToClick}
                >
                  Add End Date
                </Button>
              )}
            </div>
          </div>
          {/* --- End Date Picker Section --- */}

          {/* Location Input */}
          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-gray-700"
            >
              Location: (Optional)
            </label>
            <input
              type="text"
              id="location"
              value={globalLocation}
              onChange={(e) => setGlobalLocation(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Where was the photo taken?"
            />
          </div>
          {/* Location Link Input */}
          <div>
            <label
              htmlFor="locationLink"
              className="block text-sm font-medium text-gray-700"
            >
              Location Link: (Optional)
            </label>
            <input
              type="url"
              id="locationLink"
              value={globalLocationLink}
              onChange={(e) => setGlobalLocationLink(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Link for location (e.g., venue website)"
            />
          </div>

          {/* Photographer Input */}
          <div>
            <label
              htmlFor="photographer"
              className="block text-sm font-medium text-gray-700"
            >
              Photographer: (Optional)
            </label>
            <input
              type="text"
              id="photographer"
              value={globalPhotographer}
              onChange={(e) => setGlobalPhotographer(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Who took the photo?"
            />
          </div>
          {/* Photographer Link Input */}
          <div>
            <label
              htmlFor="photographerLink"
              className="block text-sm font-medium text-gray-700"
            >
              Photographer Link: (Optional)
            </label>
            <input
              type="url"
              id="photographerLink"
              value={globalPhotographerLink}
              onChange={(e) => setGlobalPhotographerLink(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Photographer's website or social media"
            />
          </div>

          {/* Event Input */}
          <div>
            <label
              htmlFor="event"
              className="block text-sm font-medium text-gray-700"
            >
              Event: (Optional)
            </label>
            <input
              type="text"
              id="event"
              value={globalEvent}
              onChange={(e) => setGlobalEvent(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="What event was this for?"
            />
          </div>
          {/* Event Link Input */}
          <div>
            <label
              htmlFor="eventLink"
              className="block text-sm font-medium text-gray-700"
            >
              Event Link: (Optional)
            </label>
            <input
              type="url"
              id="eventLink"
              value={globalEventLink}
              onChange={(e) => setGlobalEventLink(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Link for the event (if any)"
            />
          </div>

          {/* Advertising Input */}
          <div>
            <label
              htmlFor="advertising"
              className="block text-sm font-medium text-gray-700"
            >
              Advertising: (Optional)
            </label>
            <input
              type="text"
              id="advertising"
              value={globalAdvertising}
              onChange={(e) => setGlobalAdvertising(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Related advertisement/brand (if any)"
            />
          </div>

          {/* Advertising Link Input */}
          <div>
            <label
              htmlFor="advertisingLink"
              className="block text-sm font-medium text-gray-700"
            >
              Advertising Link: (Optional)
            </label>
            <input
              type="url"
              id="advertisingLink"
              value={globalAdvertisingLink}
              onChange={(e) => setGlobalAdvertisingLink(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Link for related advertisement (if any)"
            />
          </div>

          {/* Category Select */}
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700"
            >
              Category:
            </label>
            <select
              id="category"
              value={globalCategory}
              onChange={(e) => setGlobalCategory(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isUploading || filesWithMetadata.length === 0}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                isUploading || filesWithMetadata.length === 0
                  ? "bg-indigo-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              }`}
            >
              {isUploading
                ? /* Loading spinner */ "Uploading..."
                : `Upload ${
                    filesWithMetadata.length > 0 ? filesWithMetadata.length : ""
                  } Photo(s)`}
            </button>
          </div>
        </form>
      </div>
      {/* --- End Left Column: Form --- */}

      {/* --- Right Column: Preview Area --- */}
      <div className="w-full md:w-3/5 lg:w-2/3 bg-gray-50 p-4 rounded-lg shadow-inner md:h-[calc(100vh-4rem)] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">
          Previews
        </h3>
        {filesWithMetadata.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Selected image previews will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filesWithMetadata.map((item) => (
              <div
                key={item.id}
                className="relative group cursor-pointer rounded-lg overflow-hidden border border-gray-200 hover:shadow-md"
                onClick={() => {
                  setSelectedFileId(item.id);
                  setIsModalOpen(true);
                }}
              >
                <img
                  src={item.previewUrl}
                  alt={`Preview of ${item.file.name}`}
                  className="h-48 w-full object-contain"
                />
                <p
                  className="text-xs text-center p-1 bg-gray-100 truncate"
                  title={item.file.name}
                >
                  {item.file.name}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* --- End Right Column: Preview Area --- */}

      {/* --- Render the Modal --- */}
      <MetadataEditModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedFileId(null);
        }}
        selectedFileData={modalPropsData}
        onSave={handleSaveMetadata}
      />
    </div>
  );
}

export default UploadForm;
