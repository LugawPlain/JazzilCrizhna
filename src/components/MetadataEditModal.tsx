"use client";
import React, {
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
  useRef,
} from "react";
import { motion } from "framer-motion";

// Re-use the FileMetadata type definition (or import if moved to a types file)
interface FileMetadata {
  id: string;
  photographer: string;
  photographerLink: string;
  eventDate: string;
  location: string;
  event: string;
  previewUrl: string; // This is for the list preview, not used directly by modal anymore
  file: File;
}

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

  // Add state variables for start and end dates and to track if showing end date
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showEndDate, setShowEndDate] = useState(false);

  // Add a date validation function at the top of the component
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
    } catch (e) {
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
    } catch (e) {
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

      // Create a new object URL specifically for the modal preview
      const url = URL.createObjectURL(selectedFileData.file);
      setModalPreviewUrl(url);

      // Cleanup function for this specific URL
      return () => {
        if (url) {
          URL.revokeObjectURL(url);
        }
        setModalPreviewUrl(null); // Reset URL state
      };
    } else {
      // Reset fields and URL if modal is closing or no file selected
      setModalPreviewUrl(null);
      // Reset date fields
      setStartDate("");
      setEndDate("");
      setShowEndDate(false);
    }
  }, [isOpen, selectedFileData]); // Depend on isOpen and the selected file data

  const [formData, setFormData] = useState<EditableMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset form when the selected file or modal state changes
  useEffect(() => {
    if (isOpen && selectedFileData) {
      setFormData(selectedFileData.currentMetadata);
      setError(null); // Clear previous errors
    } else {
      setFormData(null); // Clear form if modal is closed or no data
    }
  }, [isOpen, selectedFileData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleSave = () => {
    if (!formData) return;
    // Add validation if needed (e.g., for required fields or URL format)
    if (!formData.photographer) {
      // Example validation
      // setError("Photographer name is required.");
      // return;
    }
    // Validate advertisingLink as URL if not empty
    if (formData.advertisingLink) {
      try {
        new URL(formData.advertisingLink);
      } catch (_) {
        setError("Invalid Advertising Link URL format.");
        return;
      }
    }

    setError(null); // Clear error before saving

    if (selectedFileData) {
      onSave(selectedFileData.id, formData);
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

          {/* Modal Content Area */}
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Edit Metadata for {selectedFileData?.file.name}
            </h2>

            {/* Conditionally render form only if formData is available */}
            {formData && (
              <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                {/* Photographer */}
                <div className="mb-4">
                  <label
                    htmlFor="photographer"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Photographer:
                  </label>
                  <input
                    type="text"
                    id="photographer"
                    name="photographer"
                    value={formData.photographer}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                {/* Photographer Link */}
                <div className="mb-4">
                  <label
                    htmlFor="photographerLink"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Photographer Link: (Optional)
                  </label>
                  <input
                    type="url"
                    id="photographerLink"
                    name="photographerLink"
                    value={formData.photographerLink}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="https://..."
                  />
                </div>
                {/* Event Date */}
                <div className="mb-4">
                  <label
                    htmlFor="eventDate"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Date:
                  </label>
                  <input
                    type="text"
                    id="eventDate"
                    name="eventDate"
                    value={formData.eventDate}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="MM/DD/YYYY or MM/DD/YYYY - MM/DD/YYYY"
                  />
                </div>
                {/* Location */}
                <div className="mb-4">
                  <label
                    htmlFor="location"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Location:
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                {/* Event */}
                <div className="mb-4">
                  <label
                    htmlFor="event"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Event:
                  </label>
                  <input
                    type="text"
                    id="event"
                    name="event"
                    value={formData.event}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
                    value={formData.advertisingLink} // This is now safe
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="https://example.com/ad"
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <p className="text-red-500 text-xs mt-2">Error: {error}</p>
                )}

                {/* Action Buttons */}
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="button" // Change from submit to button, handle save via onClick
                    onClick={handleSave}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetadataEditModal;
