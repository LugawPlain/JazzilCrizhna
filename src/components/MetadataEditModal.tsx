"use client";
import React, {
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
  useRef,
} from "react";

// Re-use the FileMetadata type definition (or import if moved to a types file)
interface FileMetadata {
  id: string;
  photographer: string;
  dateTaken: string;
  location: string;
  event: string;
  previewUrl: string; // This is for the list preview, not used directly by modal anymore
  file: File;
}

interface MetadataEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Pass the essential data, including the raw file
  selectedFileData: {
    id: string;
    file: File;
    currentMetadata: Omit<FileMetadata, "id" | "file" | "previewUrl">; // Pass current metadata separately
  } | null;
  // Update onSave signature to match the separated metadata
  onSave: (
    id: string,
    updatedMetadata: Omit<FileMetadata, "id" | "file" | "previewUrl">
  ) => void;
}

const MetadataEditModal: React.FC<MetadataEditModalProps> = ({
  isOpen,
  onClose,
  selectedFileData, // Use selectedFileData prop
  onSave,
}) => {
  // Local state for form inputs
  const [photographer, setPhotographer] = useState("");
  const [dateTaken, setDateTaken] = useState("");
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

  // Helper function to update the combined date
  const updateCombinedDate = (start: string, end: string) => {
    if (start && end && showEndDate) {
      setDateTaken(`${start} - ${end}`);
    } else if (start) {
      setDateTaken(start);
    } else {
      setDateTaken("");
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

  // Effect to update local state and create/revoke modal preview URL
  useEffect(() => {
    if (isOpen && selectedFileData) {
      // Set metadata fields from the passed currentMetadata
      setPhotographer(selectedFileData.currentMetadata.photographer || "");

      // Get the dateTaken value
      const fileDate = selectedFileData.currentMetadata.dateTaken || "";
      setDateTaken(fileDate);

      // Parse the date for our dual input fields
      if (fileDate.includes(" - ")) {
        const [start, end] = fileDate.split(" - ");
        setStartDate(start);
        setEndDate(end);
        setShowEndDate(true);
      } else if (fileDate) {
        setStartDate(fileDate);
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

  const handleSave = (e: FormEvent) => {
    e.preventDefault();

    // Reset any previous validation errors
    setValidationError(null);

    // Validate date format
    if (dateTaken && !isValidDateFormat(dateTaken)) {
      setValidationError(
        "Invalid date format. Use MM/DD/YYYY for single dates or MM/DD/YYYY - MM/DD/YYYY for ranges."
      );
      return;
    }

    if (selectedFileData) {
      // Pass only the updatable metadata fields
      onSave(selectedFileData.id, {
        photographer,
        dateTaken,
        location,
        event,
      });
    }
    onClose(); // Close modal after saving
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
                  htmlFor="modalStartDate"
                  className="block text-sm font-medium text-gray-700"
                >
                  Date: (Optional)
                </label>
                <div className="mt-1 flex flex-wrap items-center space-y-2 md:space-y-0">
                  <div className="flex-1 min-w-[180px] mr-2">
                    <input
                      type="text"
                      id="modalStartDate"
                      ref={startDateInputRef}
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
                        id="modalEndDate"
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
                  id="modalDateTaken"
                  name="dateTaken"
                  value={dateTaken}
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
