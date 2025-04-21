"use client";
import React, {
  useState,
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
} from "react";
import MetadataEditModal from "./MetadataEditModal"; // Import the modal
// import { db, storage } from "../lib/firebase"; // Commented out
// import { collection, addDoc, serverTimestamp } from "firebase/firestore"; // Commented out
// import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"; // Commented out

// Define a type for individual file metadata
interface FileMetadata {
  id: string; // Use a unique ID, maybe based on file name + index
  photographer: string;
  dateTaken: string;
  location: string; // Added location state
  event: string;
  previewUrl: string;
  file: File; // Keep the original file object associated
}

function UploadForm() {
  // Keep global states for now, might be used as defaults or if no specific metadata is set
  const [globalDateTaken, setGlobalDateTaken] = useState("");
  const [globalLocation, setGlobalLocation] = useState(""); // Changed from location
  const [globalPhotographer, setGlobalPhotographer] = useState(""); // Changed from photographer
  const [globalCategory, setGlobalCategory] = useState(""); // Category remains global, changed from category
  const [globalEvent, setGlobalEvent] = useState(""); // Changed from event

  // State for individual files and their metadata
  const [filesWithMetadata, setFilesWithMetadata] = useState<FileMetadata[]>(
    []
  );

  // const [imageFiles, setImageFiles] = useState<File[]>([]); // Remove old state
  // const [dateTaken, setDateTaken] = useState(""); // Remove old state
  // const [location, setLocation] = useState(""); // Remove old state
  // const [photographer, setPhotographer] = useState(""); // Remove old state
  // const [category, setCategory] = useState(""); // Remove old state
  // const [event, setEvent] = useState(""); // Remove old state

  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // State for the modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  // Categories for the dropdown
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

  // Add state variables for start and end dates and to track if showing end date
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showEndDate, setShowEndDate] = useState(false);

  // Add references for date inputs
  const startDateInputRef = React.useRef<HTMLInputElement>(null);
  const endDateInputRef = React.useRef<HTMLInputElement>(null);

  // --- Cleanup Object URLs ---
  useEffect(() => {
    // This function will run when the component unmounts or before the effect runs again
    return () => {
      filesWithMetadata.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [filesWithMetadata]); // Dependency array ensures cleanup happens when files change

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // Clear previous errors/success messages
      setError(null);
      setSuccess(false);
      setSuccessMessage("");

      // Revoke previous URLs before creating new ones
      filesWithMetadata.forEach((item) => URL.revokeObjectURL(item.previewUrl));

      const selectedFiles = Array.from(e.target.files);
      const newFilesWithMetadata: FileMetadata[] = selectedFiles.map(
        (file, index) => {
          const previewUrl = URL.createObjectURL(file);
          const id = `${file.name}-${index}-${Date.now()}`; // Create a simple unique ID
          return {
            id,
            file,
            previewUrl,
            // Initialize specific metadata with default date
            photographer: "",
            dateTaken: "1/1/2000", // Set default date
            location: "",
            event: "",
          };
        }
      );

      setFilesWithMetadata(newFilesWithMetadata);
    }
    // Reset file input visually if needed (optional)
    // If you want the input to show "No file chosen" after selection, uncomment:
    // if (e.target) {
    //    e.target.value = "";
    // }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Check if any files are selected
    if (filesWithMetadata.length === 0) {
      setError("Please select at least one image.");
      return;
    }
    // Category is still required globally
    if (!globalCategory) {
      setError("Please select a category.");
      return;
    }

    // Validate date format
    if (globalDateTaken && !isValidDateFormat(globalDateTaken)) {
      setError(
        "Invalid date format. Use MM/DD/YYYY for single dates or MM/DD/YYYY - MM/DD/YYYY for ranges."
      );
      return;
    }

    // Check individual file date formats
    const invalidDates = filesWithMetadata.filter(
      (item) => item.dateTaken && !isValidDateFormat(item.dateTaken)
    );

    if (invalidDates.length > 0) {
      setError(
        `Invalid date format in ${invalidDates.length} file(s). Use MM/DD/YYYY for single dates or MM/DD/YYYY - MM/DD/YYYY for ranges.`
      );
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(false);
    setSuccessMessage("");

    // --- Prepare per-file metadata, applying global defaults ---
    const finalMetadata = filesWithMetadata.map((item) => {
      // Start with the specific metadata from the item
      const specificMetadata = {
        photographer: item.photographer,
        dateTaken: item.dateTaken,
        location: item.location,
        event: item.event,
        // Include original filename, might be useful for backend matching
        originalFilename: item.file.name,
      };

      // Apply global defaults only if the specific field is empty
      if (specificMetadata.photographer === "") {
        specificMetadata.photographer = globalPhotographer;
      }
      if (specificMetadata.dateTaken === "") {
        specificMetadata.dateTaken = globalDateTaken;
      }
      // Add location if it exists in specific or global
      if (specificMetadata.location === "") {
        specificMetadata.location = globalLocation;
      }
      if (specificMetadata.event === "") {
        specificMetadata.event = globalEvent;
      }

      // Clean up empty strings if they weren't replaced by global defaults
      // (Optional, depends on how backend handles null/empty)
      // Object.keys(specificMetadata).forEach(key => {
      //    if (specificMetadata[key as keyof typeof specificMetadata] === "") {
      //        specificMetadata[key as keyof typeof specificMetadata] = null; // or delete specificMetadata[key]
      //    }
      // });

      return specificMetadata;
    });

    // --- Create FormData ---
    const formData = new FormData();

    // 1. Append all the files (ensure field name matches backend expectations)
    filesWithMetadata.forEach((item) => {
      formData.append(`file`, item.file);
    });

    // 2. Append the global category (still required globally)
    if (globalCategory) {
      formData.append("category", globalCategory);
    } else {
      // This case should be caught by earlier validation, but added defensively
      setError("Category is missing.");
      setIsUploading(false);
      return;
    }

    // 3. Append the array of final metadata as a JSON string
    // IMPORTANT: Backend MUST be updated to parse this field!
    formData.append("metadataArray", JSON.stringify(finalMetadata));

    // Remove old global appends (except category)
    // if (globalPhotographer) formData.append("photographer", globalPhotographer);
    // if (globalDateTaken) formData.append("date", globalDateTaken);
    // if (globalEvent) formData.append("event", globalEvent);

    // --- Send Request ---
    try {
      console.log("Submitting FormData:");
      // Log the metadata being sent for debugging
      console.log("Metadata Array:", finalMetadata);
      // You can also iterate formData entries, but files make it tricky
      // for(var pair of formData.entries()) {
      //    console.log(pair[0]+ ': '+ pair[1]);
      // }

      const response = await fetch("/api/admin/uploadimages", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle potential array of errors from backend if modified later
        let errorMessage =
          result.error || `Upload failed with status: ${response.status}`;
        if (result.details) {
          errorMessage += `: ${result.details}`;
        }
        if (Array.isArray(result.errors) && result.errors.length > 0) {
          errorMessage = `Multiple errors occurred. First: ${result.errors[0]}`;
        }
        throw new Error(errorMessage);
      }

      setSuccess(true);
      // Update success message for multiple files
      setSuccessMessage(
        result.message ||
          `${
            result.count || filesWithMetadata.length
          } file(s) uploaded successfully!`
      );

      // Reset state
      setFilesWithMetadata([]); // Clear files
      setGlobalDateTaken("1/1/2000");
      setGlobalLocation("");
      setGlobalPhotographer("");
      setGlobalCategory("");
      setGlobalEvent("");
      // Reset file input visually (important if not resetting e.target.value in handleFileChange)
      const fileInput = document.getElementById(
        "fileInput"
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (err: any) {
      console.error("Upload failed:", err);
      setError(`Upload failed: ${err.message}`);
      setSuccess(false);
      setSuccessMessage("");
    } finally {
      setIsUploading(false);
    }
  };

  // --- Add handleSaveMetadata function ---
  const handleSaveMetadata = (
    id: string,
    updatedMetadata: Omit<FileMetadata, "id" | "file" | "previewUrl">
  ) => {
    setFilesWithMetadata((prevFiles) =>
      prevFiles.map((file) =>
        file.id === id ? { ...file, ...updatedMetadata } : file
      )
    );
    // Optionally close modal here, although the modal closes itself too
    // setIsModalOpen(false);
    // setSelectedFileId(null);
  };

  // --- Find the selected file for the modal ---
  const selectedFileForModal = filesWithMetadata.find(
    (f) => f.id === selectedFileId
  );

  // Prepare props for the modal in the new format
  const modalPropsData = selectedFileForModal
    ? {
        id: selectedFileForModal.id,
        file: selectedFileForModal.file,
        currentMetadata: {
          // Extract current metadata part
          photographer: selectedFileForModal.photographer,
          dateTaken: selectedFileForModal.dateTaken,
          location: selectedFileForModal.location,
          event: selectedFileForModal.event,
        },
      }
    : null;

  // Utility to validate date range format
  const isValidDateFormat = (dateStr: string): boolean => {
    // Empty is valid (optional field)
    if (!dateStr.trim()) return true;

    // Check if it's a range (contains a hyphen)
    if (dateStr.includes("-")) {
      const dateParts = dateStr.split("-").map((part) => part.trim());

      // Must have exactly two parts with content
      if (dateParts.length !== 2 || !dateParts[0] || !dateParts[1]) {
        return false;
      }

      // Try to parse both dates
      const startDate = new Date(dateParts[0]);
      const endDate = new Date(dateParts[1]);

      // Both must be valid dates
      return !isNaN(startDate.getTime()) && !isNaN(endDate.getTime());
    }

    // If not a range, just check if it's a valid date
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  };

  // Function to update the combined date based on start and end dates
  const updateCombinedDate = (start: string, end: string) => {
    if (start && end && showEndDate) {
      setGlobalDateTaken(`${start} - ${end}`);
    } else if (start) {
      setGlobalDateTaken(start);
    } else {
      setGlobalDateTaken("");
    }
  };

  // Handle start date change
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);

    // Update combined date
    updateCombinedDate(newStartDate, showEndDate ? endDate : "");
  };

  // Handle end date change
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    setEndDate(newEndDate);

    // Update combined date
    updateCombinedDate(startDate, newEndDate);
  };

  // Handle the "Up To" button click
  const handleUpToClick = () => {
    setShowEndDate(true);

    // Set endDate to startDate as default if not set yet
    if (!endDate && startDate) {
      setEndDate(startDate);
    }

    // Focus the end date input after state update
    setTimeout(() => {
      if (endDateInputRef.current) {
        endDateInputRef.current.focus();
      }
    }, 0);

    // Update the combined date
    updateCombinedDate(startDate, endDate || startDate);
  };

  // Effect to sync the individual date fields when globalDateTaken changes from outside
  // (e.g. when the form is reset)
  useEffect(() => {
    if (globalDateTaken === "1/1/2000") {
      // Default state - just first date
      setStartDate("1/1/2000");
      setEndDate("");
      setShowEndDate(false);
    } else if (globalDateTaken.includes(" - ")) {
      // Has range format
      const [start, end] = globalDateTaken.split(" - ");
      setStartDate(start);
      setEndDate(end);
      setShowEndDate(true);
    } else if (globalDateTaken) {
      // Just a single date
      setStartDate(globalDateTaken);
      setEndDate("");
      setShowEndDate(false);
    } else {
      // Empty
      setStartDate("");
      setEndDate("");
      setShowEndDate(false);
    }
  }, [globalDateTaken]);

  return (
    // --- Main Flex Container ---
    <div className="flex flex-col md:flex-row gap-6 p-4 md:p-8 min-h-screen mt-24">
      {/* --- Left Column: Form --- */}
      {/* Removed mx-auto, added width constraints */}
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
            {/* Display names of selected files - REMOVED */}
            {/* {filesWithMetadata.length > 0 && ( 
              <div className="mt-2 text-sm text-gray-600">
                <p>Selected files:</p>
                <ul className="list-disc list-inside pl-4 max-h-20 overflow-y-auto">
                  {filesWithMetadata.map((item, index) => (
                    <li key={index} className="truncate">
                      {item.file.name}
                    </li>
                  ))}
                </ul>
              </div>
            )} */}
          </div>

          <div>
            <label
              htmlFor="dateTaken"
              className="block text-sm font-medium text-gray-700"
            >
              Date Taken: (Optional)
            </label>
            <div className="mt-1 flex flex-wrap items-center space-y-2 md:space-y-0">
              <div className="flex-1 min-w-[180px] mr-2">
                <input
                  type="text"
                  id="startDate"
                  value={startDate}
                  onChange={handleStartDateChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Start date (e.g., 4/10/2025)"
                />
              </div>

              {showEndDate ? (
                <div className="flex-1 min-w-[180px] mr-2">
                  <input
                    type="text"
                    id="endDate"
                    ref={endDateInputRef}
                    value={endDate}
                    onChange={handleEndDateChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="End date (e.g., 4/13/2025)"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleUpToClick}
                  className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Add End Date
                </button>
              )}

              {showEndDate && (
                <button
                  type="button"
                  onClick={() => {
                    setShowEndDate(false);
                    setEndDate("");
                    updateCombinedDate(startDate, "");
                  }}
                  className="inline-flex items-center ml-2 px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Hidden field to preserve the actual combined date value */}
            <input
              type="hidden"
              id="dateTaken"
              name="dateTaken"
              value={globalDateTaken}
            />
          </div>

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
              {isUploading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Uploading...
                </span>
              ) : (
                `Upload ${
                  filesWithMetadata.length > 0 ? filesWithMetadata.length : ""
                } Photo(s)`
              )}
            </button>
          </div>
        </form>
      </div>
      {/* --- End Left Column: Form --- */}

      {/* --- Right Column: Preview Area --- */}
      <div className="w-full md:w-3/5 lg:w-2/3 bg-gray-50 p-4 rounded-lg shadow-inner md:h-[calc(100vh-4rem)] overflow-y-auto">
        {" "}
        {/* Adjusted height and overflow */}
        <h3 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">
          Previews
        </h3>
        {filesWithMetadata.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Selected image previews will appear here.</p>
          </div>
        ) : (
          // Moved and adjusted preview grid
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
                  // Increased image size
                  className="h-48 w-full object-contain"
                />
                {/* Overlay */}
                {/* <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center transition-opacity duration-200">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-white opacity-0 group-hover:opacity-100"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </div> */}
                {/* Optional: Display filename below image */}
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
        // Pass the prepared data object in the selectedFileData prop
        selectedFileData={modalPropsData}
        onSave={handleSaveMetadata}
      />
      {/* --- End Modal --- */}
    </div>
    // --- End Main Flex Container ---
  );
}

export default UploadForm;
