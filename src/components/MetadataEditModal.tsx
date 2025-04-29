"use client";
import React, { useState, useEffect, FormEvent } from "react";
import { format, parse } from "date-fns";
import { Calendar as CalendarIcon, X as XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Re-use the FileMetadata type definition (or import if moved to a types file)

// Define a type for the editable part of the metadata
// Mirror the Pick used in UploadForm.tsx
interface EditableMetadata {
  photographer: string;
  photographerLink: string;
  eventDate: string;
  location: string;
  locationLink: string;
  event: string;
  eventLink: string;
  advertising: string;
  advertisingLink: string;
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
  const [location, setLocation] = useState("");
  const [locationLink, setLocationLink] = useState("");
  const [event, setEvent] = useState("");
  const [eventLink, setEventLink] = useState("");
  const [advertising, setAdvertising] = useState("");
  // State for the modal's own preview URL
  const [modalPreviewUrl, setModalPreviewUrl] = useState<string | null>(null);
  const [advertisingLink, setAdvertisingLink] = useState("");

  // State for the shadcn date pickers
  const [startDateObj, setStartDateObj] = useState<Date | undefined>();
  const [endDateObj, setEndDateObj] = useState<Date | undefined>();
  const [showEndDate, setShowEndDate] = useState(false);

  // State for validation error
  const [validationError, setValidationError] = useState<string | null>(null);

  // Effect to update local state and create/revoke modal preview URL
  useEffect(() => {
    if (isOpen && selectedFileData) {
      // Set metadata fields from the passed currentMetadata
      setPhotographer(selectedFileData.currentMetadata.photographer || "");
      setPhotographerLink(
        selectedFileData.currentMetadata.photographerLink || ""
      );

      // Get the eventDate value
      const fileDateString = selectedFileData.currentMetadata.eventDate || "";
      if (fileDateString.includes(" - ")) {
        const [startStr, endStr] = fileDateString.split(" - ");
        // Attempt to parse using expected format
        const parsedStart = parse(startStr, "MM/dd/yyyy", new Date());
        const parsedEnd = parse(endStr, "MM/dd/yyyy", new Date());

        if (!isNaN(parsedStart.getTime())) setStartDateObj(parsedStart);
        else setStartDateObj(undefined); // Clear if parse fails

        if (!isNaN(parsedEnd.getTime())) setEndDateObj(parsedEnd);
        else setEndDateObj(undefined);

        setShowEndDate(true);
      } else if (fileDateString) {
        const parsedStart = parse(fileDateString, "MM/dd/yyyy", new Date());
        if (!isNaN(parsedStart.getTime())) setStartDateObj(parsedStart);
        else setStartDateObj(undefined);

        setEndDateObj(undefined); // Clear end date
        setShowEndDate(false);
      } else {
        // Clear dates if incoming string is empty
        setStartDateObj(undefined);
        setEndDateObj(undefined);
        setShowEndDate(false);
      }

      setLocation(selectedFileData.currentMetadata.location || "");
      setLocationLink(selectedFileData.currentMetadata.locationLink || "");
      setEvent(selectedFileData.currentMetadata.event || "");
      setEventLink(selectedFileData.currentMetadata.eventLink || "");
      setAdvertising(selectedFileData.currentMetadata.advertising || "");
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
        setStartDateObj(undefined);
        setEndDateObj(undefined);
        setShowEndDate(false);
        setAdvertisingLink(""); // Reset advertising link state
        setLocationLink("");
        setEventLink("");
        setAdvertising("");
        setValidationError(null);
      };
    } else {
      // Reset fields and URL if modal is closing or no file selected
      setModalPreviewUrl(null);
      // Reset date fields
      setStartDateObj(undefined);
      setEndDateObj(undefined);
      setShowEndDate(false);
      setAdvertisingLink(""); // Reset advertising link state
      setLocationLink("");
      setEventLink("");
      setAdvertising("");
      setValidationError(null);
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
      let formattedEventDate = "";
      if (startDateObj) {
        formattedEventDate = format(startDateObj, "MM/dd/yyyy");
        if (showEndDate && endDateObj) {
          // Double check validity (Calendar handles disabling, but good practice)
          if (endDateObj >= startDateObj) {
            formattedEventDate += ` - ${format(endDateObj, "MM/dd/yyyy")}`;
          } else {
            console.warn(
              "End date is before start date in modal, saving start date only."
            );
          }
        }
      }

      const updatedMetadata: EditableMetadata = {
        photographer: photographer,
        photographerLink: photographerLink,
        eventDate: formattedEventDate,
        location: location,
        locationLink: locationLink,
        event: event,
        eventLink: eventLink,
        advertising: advertising,
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date(s):
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[140px] justify-start text-left font-normal",
                          !startDateObj && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDateObj ? (
                          format(startDateObj, "MM/dd/yyyy")
                        ) : (
                          <span>Start date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDateObj}
                        onSelect={setStartDateObj}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  {showEndDate ? (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">-</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[140px] justify-start text-left font-normal",
                              !endDateObj && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDateObj ? (
                              format(endDateObj, "MM/dd/yyyy")
                            ) : (
                              <span>End date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={endDateObj}
                            onSelect={setEndDateObj}
                            disabled={
                              startDateObj
                                ? { before: startDateObj }
                                : undefined
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setShowEndDate(false);
                          setEndDateObj(undefined);
                        }}
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
                      onClick={() => {
                        setShowEndDate(true);
                        if (startDateObj && !endDateObj) {
                          setEndDateObj(startDateObj);
                        }
                      }}
                    >
                      Add End Date
                    </Button>
                  )}
                </div>
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
              {/* Location Link Input */}
              <div>
                <label
                  htmlFor="modalLocationLink"
                  className="block text-sm font-medium text-gray-700"
                >
                  Location Link: (Optional)
                </label>
                <input
                  type="url"
                  id="modalLocationLink"
                  value={locationLink}
                  onChange={(e) => setLocationLink(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="e.g. Venue Website"
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
              {/* Event Link Input */}
              <div>
                <label
                  htmlFor="modalEventLink"
                  className="block text-sm font-medium text-gray-700"
                >
                  Event Link: (Optional)
                </label>
                <input
                  type="url"
                  id="modalEventLink"
                  value={eventLink}
                  onChange={(e) => setEventLink(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="e.g. Event Page URL"
                />
              </div>
              {/* Advertising Input */}
              <div>
                <label
                  htmlFor="modalAdvertising"
                  className="block text-sm font-medium text-gray-700"
                >
                  Advertising/Brand: (Optional)
                </label>
                <input
                  type="text"
                  id="modalAdvertising"
                  value={advertising}
                  onChange={(e) => setAdvertising(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="e.g. Brand Name"
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
                  value={advertisingLink}
                  onChange={(e) => setAdvertisingLink(e.target.value)}
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
