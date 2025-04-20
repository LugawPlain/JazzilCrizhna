"use client";
import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";

// Re-use the FileMetadata type definition (or import if moved to a types file)
interface FileMetadata {
  id: string;
  photographer: string;
  dateTaken: string;
  location: string;
  event: string;
  previewUrl: string;
  file: File;
}

interface MetadataEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileMetadata: FileMetadata | null; // Can be null initially
  onSave: (id: string, updatedMetadata: Partial<FileMetadata>) => void;
}

const MetadataEditModal: React.FC<MetadataEditModalProps> = ({
  isOpen,
  onClose,
  fileMetadata,
  onSave,
}) => {
  // Local state for form inputs, initialized when fileMetadata changes
  const [photographer, setPhotographer] = useState("");
  const [dateTaken, setDateTaken] = useState("");
  const [location, setLocation] = useState("");
  const [event, setEvent] = useState("");

  // Effect to update local state when the selected file changes
  useEffect(() => {
    if (fileMetadata) {
      setPhotographer(fileMetadata.photographer || "");
      setDateTaken(fileMetadata.dateTaken || "");
      setLocation(fileMetadata.location || "");
      setEvent(fileMetadata.event || "");
    }
  }, [fileMetadata]);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (fileMetadata) {
      onSave(fileMetadata.id, {
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

  if (!isOpen || !fileMetadata) {
    return null; // Don't render anything if not open or no file selected
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 transition-opacity duration-300 ease-in-out"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden"
        onClick={(e) => e.stopPropagation()} // Prevent click inside modal from closing it
      >
        {/* Left Side: Image Preview */}
        <div className="w-full md:w-1/2 p-4 flex justify-center items-center bg-gray-100">
          <img
            src={fileMetadata.previewUrl}
            alt={`Preview of ${fileMetadata.file.name}`}
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
            title={fileMetadata.file.name}
          >
            File: {fileMetadata.file.name}
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
