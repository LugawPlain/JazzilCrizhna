"use client";
import React, { useState, useEffect, FormEvent } from "react";

// Re-use the FileMetadata type definition (or import if moved to a types file)

// Define a type for the editable part of the metadata
// Mirror the Pick used in UploadForm.tsx
interface EditableMetadata {
  photographer: string;
  photographerLink: string;
  eventDate: string;
  location: string;
  event: string;
  advertisingLink: string; // <-- Add field
}

// Define a type for the data passed as props
interface SelectedFileData {
  id: string;
  file: File; // Keep the original file object if needed for display/context
  currentMetadata: EditableMetadata; // Use the type above
}

interface MetadataEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFileData: SelectedFileData | null; // Can be null if no file is selected
  onSave: (id: string, updatedMetadata: EditableMetadata) => void; // Use the type above
}

const MetadataEditModal: React.FC<MetadataEditModalProps> = ({
  isOpen,
  onClose,
  selectedFileData, // Use selectedFileData prop
  onSave,
}) => {
  // Local state for form inputs
  const [photographer, setPhotographer] = useState("");
  const [photographerLink, setPhotographerLink] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [event, setEvent] = useState("");
  // State for the modal's own preview URL
  const [modalPreviewUrl, setModalPreviewUrl] = useState<string | null>(null);
  // Add state for advertising link
  const [advertisingLink, setAdvertisingLink] = useState("");

  // Add state variables for start and end dates and to track if showing end date
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showEndDate, setShowEndDate] = useState(false);

  // Add state for validation error
  const [validationError, setValidationError] = useState<string | null>(null);

  // Add references for date inputs
  const startDateInputRef = React.useRef<HTMLInputElement>(null);
  const endDateInputRef = React.useRef<HTMLInputElement>(null);

  // Update the handleUpToClick to show the second date field
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
        // Select all text in the input for easy replacement
        endDateInputRef.current.select();
      }
    }, 0);

    // Update the combined date
    updateCombinedDate(startDate, endDate || startDate);
  };

  // Handle start date change
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);

    // Update combined date
    updateCombinedDate(newStartDate, showEndDate ? endDate : "");
  };

  // Helper to format date from YYYY-MM-DD to MM/DD/YYYY for display
  const formatDateForDisplay = (dateStr: string): string => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  // Helper to format date from MM/DD/YYYY to YYYY-MM-DD for input
  const formatDateForInput = (dateStr: string): string => {
    if (!dateStr) return "";
    try {
      // If already in YYYY-MM-DD format, return as is
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;

      // Parse MM/DD/YYYY format
      const parts = dateStr.split("/");
      if (parts.length !== 3) return dateStr;

      const month = parseInt(parts[0], 10);
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);

      if (isNaN(month) || isNaN(day) || isNaN(year)) return dateStr;

      // Format as YYYY-MM-DD with padding
      return `${year}-${month.toString().padStart(2, "0")}-${day
        .toString()
        .padStart(2, "0")}`;
    } catch {
      return dateStr;
    }
  };

  // Helper function to update the combined date
  const updateCombinedDate = (start: string, end: string) => {
    if (start && end && showEndDate) {
      // Format dates for display in MM/DD/YYYY format
      const formattedStart = formatDateForDisplay(start);
      const formattedEnd = formatDateForDisplay(end);
      setEventDate(`${formattedStart} - ${formattedEnd}`);
    } else if (start) {
      setEventDate(formatDateForDisplay(start));
    } else {
      setEventDate("");
    }
  };

  // Handle end date change
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    setEndDate(newEndDate);

    // Update combined date
    updateCombinedDate(startDate, newEndDate);
  };

  // Effect to update local state and create/revoke modal preview URL
  useEffect(() => {
    if (isOpen && selectedFileData) {
      // Set metadata fields from the passed currentMetadata
      setPhotographer(selectedFileData.currentMetadata.photographer || "");
      setPhotographerLink(
        selectedFileData.currentMetadata.photographerLink || ""
      );

      // Get the eventDate value
      const fileDate = selectedFileData.currentMetadata.eventDate || "";
      setEventDate(fileDate);

      // Parse the date for our dual input fields
      if (fileDate.includes(" - ")) {
        const [start, end] = fileDate.split(" - ");
        setStartDate(formatDateForInput(start));
        setEndDate(formatDateForInput(end));
        setShowEndDate(true);
      } else if (fileDate) {
        setStartDate(formatDateForInput(fileDate));
        setEndDate("");
        setShowEndDate(false);
      } else {
        setStartDate("");
        setEndDate("");
        setShowEndDate(false);
      }

      setLocation(selectedFileData.currentMetadata.location || "");
      setEvent(selectedFileData.currentMetadata.event || "");
      setAdvertisingLink(
        selectedFileData.currentMetadata.advertisingLink || ""
      ); // Set advertising link state

      // Create a new object URL specifically for the modal preview
      const url = URL.createObjectURL(selectedFileData.file);
      setModalPreviewUrl(url);

      // Cleanup function for this specific URL
      return () => {
        if (url) {
          URL.revokeObjectURL(url);
        }
        setModalPreviewUrl(null); // Reset URL state
        setStartDate("");
        setEndDate("");
        setShowEndDate(false);
        setAdvertisingLink(""); // Reset advertising link state
      };
    } else {
      // Reset fields and URL if modal is closing or no file selected
      setModalPreviewUrl(null);
      // Reset date fields
      setStartDate("");
      setEndDate("");
      setShowEndDate(false);
      setAdvertisingLink(""); // Reset advertising link state
    }
  }, [isOpen, selectedFileData]); // Depend on isOpen and the selected file data

  const handleSave = (e?: FormEvent<HTMLFormElement>) => {
    // Add FormEvent type
    e?.preventDefault(); // Prevent default form submission if triggered by form
    // Validate advertisingLink as URL if not empty
    if (advertisingLink) {
      try {
        new URL(advertisingLink);
      } catch {
        setValidationError("Invalid Advertising Link URL format."); // Use validationError state
        return;
      }
    }

    setValidationError(null); // Clear validation error before saving

    if (selectedFileData) {
      // Construct the updated metadata object from individual states
      const updatedMetadata: EditableMetadata = {
        photographer: photographer,
        photographerLink: photographerLink,
        eventDate: eventDate, // eventDate state already holds the combined/formatted date
        location: location,
        event: event,
        advertisingLink: advertisingLink,
      };

      onSave(selectedFileData.id, updatedMetadata); // Pass the constructed object
      onClose(); // Close modal on successful save
    }
  };

  // Handle clicking outside the modal content to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Check for isOpen, selectedFileData, AND modalPreviewUrl before rendering
  if (!isOpen || !selectedFileData || !modalPreviewUrl) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 transition-opacity duration-300 ease-in-out"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Side: Image Preview */}
        <div className="w-full md:w-1/2 p-4 flex justify-center items-center bg-gray-100">
          <img
            src={modalPreviewUrl} // Use the modal-specific URL
            alt={`Preview of ${selectedFileData.file.name}`}
            className="max-h-[80vh] max-w-full object-contain rounded"
          />
        </div>

        {/* Right Side: Metadata Form */}
        <div className="w-full md:w-1/2 p-6 flex flex-col overflow-y-auto">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">
            Edit Metadata
          </h3>
          <p
            className="text-sm text-gray-600 mb-4 truncate"
            title={selectedFileData.file.name}
          >
            File: {selectedFileData.file.name}
          </p>

          <form
            onSubmit={handleSave}
            className="space-y-4 flex-grow flex flex-col"
          >
            <div className="flex-grow space-y-4">
              <div>
                <label
                  htmlFor="modalPhotographer"
                  className="block text-sm font-medium text-gray-700"
                >
                  Photographer: (Optional)
                </label>
                <input
                  type="text"
                  id="modalPhotographer"
                  value={photographer}
                  onChange={(e) => setPhotographer(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Who took the photo?"
                />
              </div>
              <div>
                <label
                  htmlFor="modalPhotographerLink"
                  className="block text-sm font-medium text-gray-700"
                >
                  Photographer Link: (Optional)
                </label>
                <input
                  type="url"
                  id="modalPhotographerLink"
                  value={photographerLink}
                  onChange={(e) => setPhotographerLink(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Photographer's website or social media"
                />
              </div>
              <div>
                <label
                  htmlFor="modalStartDate"
                  className="block text-sm font-medium text-gray-700"
                >
                  Date: (Optional)
                </label>
                <div className="mt-1 flex flex-wrap items-center space-y-2 md:space-y-0">
                  <div className="flex-1 min-w-[180px] mr-2">
                    <input
                      type="date"
                      id="modalStartDate"
                      ref={startDateInputRef}
                      value={startDate}
                      onChange={handleStartDateChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>

                  {showEndDate ? (
                    <div className="flex-1 min-w-[180px] mr-2">
                      <input
                        type="date"
                        id="modalEndDate"
                        ref={endDateInputRef}
                        value={endDate}
                        onChange={handleEndDateChange}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
                  id="modalEventDate"
                  name="eventDate"
                  value={eventDate}
                />
              </div>
              <div>
                <label
                  htmlFor="modalLocation"
                  className="block text-sm font-medium text-gray-700"
                >
                  Location: (Optional)
                </label>
                <input
                  type="text"
                  id="modalLocation"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Where was the photo taken?"
                />
              </div>
              <div>
                <label
                  htmlFor="modalEvent"
                  className="block text-sm font-medium text-gray-700"
                >
                  Event: (Optional)
                </label>
                <input
                  type="text"
                  id="modalEvent"
                  value={event}
                  onChange={(e) => setEvent(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="What event was this for?"
                />
              </div>
              {/* Add Advertising Link Field */}
              <div className="mb-4">
                <label
                  htmlFor="advertisingLink"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Advertising Link: (Optional)
                </label>
                <input
                  type="url"
                  id="advertisingLink"
                  name="advertisingLink"
                  value={advertisingLink} // Use advertisingLink state
                  onChange={(e) => setAdvertisingLink(e.target.value)} // Use setter directly
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="https://example.com/ad"
                />
              </div>
            </div>

            {/* Add validation error display before the buttons in the form */}
            {validationError && (
              <div className="text-red-500 text-sm mt-2 mb-2">
                {validationError}
              </div>
            )}

            {/* Buttons */}
            <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MetadataEditModal;
