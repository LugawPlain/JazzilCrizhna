import React from "react";
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
  // Add any other fields displayed in the modal
}

interface ImageDetailModalProps {
  image: ImageData;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

const ImageDetailModal: React.FC<ImageDetailModalProps> = ({
  image,
  onClose,
  onNext,
  onPrev,
}) => {
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

        {/* Details Section - Positioned absolutely at the bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 md:p-6 text-white pointer-events-none">
          {/* Enable pointer events for the content inside */}
          <div className="pointer-events-auto max-w-xl">
            <h2 className="text-xl md:text-2xl font-semibold mb-2 drop-shadow-md">
              {image.event}
            </h2>
            <div className="space-y-1 text-sm md:text-base opacity-90">
              <p>
                <strong className="font-medium text-neutral-300 mr-2">
                  Location:
                </strong>
                {image.location}
              </p>
              <p>
                <strong className="font-medium text-neutral-300 mr-2">
                  Date:
                </strong>
                {image.date}
              </p>
              <p>
                <strong className="font-medium text-neutral-300 mr-2">
                  Photographer:
                </strong>
                {image.photographerLink && image.photographerLink !== "#" ? (
                  <Link
                    href={image.photographerLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-neutral-100 transition-colors"
                    onClick={(e) => e.stopPropagation()} // Stop prop here too
                  >
                    {image.photographer}
                  </Link>
                ) : (
                  <span>{image.photographer}</span>
                )}
              </p>
              {/* Optional: Add Image ID back if needed for debug */}
              {/*
              <p className="pt-2 text-xs text-neutral-400">
                  Image ID: {image.id || image.r2FileKey || 'N/A'}
              </p>
              */}
            </div>
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

export default ImageDetailModal;
