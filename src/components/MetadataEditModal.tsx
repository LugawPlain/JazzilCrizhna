"use client";
import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";

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

  // Effect to update local state and create/revoke modal preview URL
  useEffect(() => {
    if (isOpen && selectedFileData) {
      // Set metadata fields from the passed currentMetadata
      setPhotographer(selectedFileData.currentMetadata.photographer || "");
      setDateTaken(selectedFileData.currentMetadata.dateTaken || "");
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
      // Optional: reset form fields if desired when modal closes
      // setPhotographer(''); setDateTaken(''); setLocation(''); setEvent('');
    }
  }, [isOpen, selectedFileData]); // Depend on isOpen and the selected file data

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
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
                  htmlFor="modalDateTaken"
                  className="block text-sm font-medium text-gray-700"
                >
                  Date Taken: (Optional)
                </label>
                <input
                  type="date"
                  id="modalDateTaken"
                  value={dateTaken}
                  onChange={(e) => setDateTaken(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
