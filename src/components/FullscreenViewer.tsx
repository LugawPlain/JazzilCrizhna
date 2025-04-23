"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { generateBlurPlaceholder } from "../utils/generateBlurPlaceholder";

interface ImageData {
  src: string;
  alt: string;
  event: string;
  location: string;
  date: string;
  photographer: string;
  photographerLink: string;
}

interface FullscreenViewerProps {
  selectedImage: ImageData;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

const FullscreenViewer = React.memo(
  ({ selectedImage, onClose, onNext, onPrev }: FullscreenViewerProps) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isBlurLoaded, setIsBlurLoaded] = useState(false);
    const [showLabels, setShowLabels] = useState(true);
    const imgRef = useRef<HTMLImageElement>(null);
    const [isNavigating, setIsNavigating] = useState(false);

    // Handle fullscreen change events
    useEffect(() => {
      const handleFullscreenChange = () => {
        // Check if we're no longer in fullscreen mode
        if (
          !document.fullscreenElement &&
          !(document as Document & { webkitFullscreenElement?: Element })
            .webkitFullscreenElement &&
          !(document as Document & { mozFullScreenElement?: Element })
            .mozFullScreenElement &&
          !(document as Document & { msFullscreenElement?: Element })
            .msFullscreenElement
        ) {
          onClose();
        }
      };

      // Add event listeners for fullscreen changes
      document.addEventListener("fullscreenchange", handleFullscreenChange);
      document.addEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.addEventListener("mozfullscreenchange", handleFullscreenChange);
      document.addEventListener("MSFullscreenChange", handleFullscreenChange);

      // Cleanup
      return () => {
        document.removeEventListener(
          "fullscreenchange",
          handleFullscreenChange
        );
        document.removeEventListener(
          "webkitfullscreenchange",
          handleFullscreenChange
        );
        document.removeEventListener(
          "mozfullscreenchange",
          handleFullscreenChange
        );
        document.removeEventListener(
          "MSFullscreenChange",
          handleFullscreenChange
        );
      };
    }, [onClose]);

    // Generate a unique blur placeholder for this image
    const blurPlaceholder = useMemo(() => {
      return generateBlurPlaceholder(1200, 800);
    }, []);

    // Handle image load with progressive enhancement
    const handleImageLoad = () => {
      setIsLoaded(true);
      setIsNavigating(false);
      // Add a small delay before showing the full image for a smoother transition
      setTimeout(() => {
        if (imgRef.current) {
          imgRef.current.style.filter = "none";
        }
      }, 100);
    };

    // Handle navigation with visual feedback
    const handleNext = () => {
      setIsNavigating(true);
      setIsLoaded(false);
      onNext();
    };

    const handlePrev = () => {
      setIsNavigating(true);
      setIsLoaded(false);
      onPrev();
    };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center"
      >
        <div className="relative w-full h-full flex flex-col items-center">
          {/* Navigation Arrows */}
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-4xl hover:text-gray-300 transition-colors z-10 bg-black/30 flex items-center justify-center px-2 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            aria-label="Previous image"
          >
            <span>←</span>
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-4xl hover:text-gray-300 transition-colors flex items-center justify-center px-2 z-10 bg-black/30  rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            aria-label="Next image"
          >
            <span>→</span>
          </button>

          {/* Close Button */}
          <button
            className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 transition-colors z-10 bg-black/30 p-2 rounded-full"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close fullscreen view"
          >
            ✕
          </button>

          {/* Image Container */}
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Blur placeholder */}
            {!isLoaded && (
              <div className="absolute inset-0 bg-gray-800">
                <img
                  src={blurPlaceholder}
                  alt="Loading..."
                  className="w-full h-full object-cover"
                  onLoad={() => setIsBlurLoaded(true)}
                />
              </div>
            )}

            <motion.img
              ref={imgRef}
              key={selectedImage.src}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: isLoaded ? 1 : 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              src={selectedImage.src}
              alt={selectedImage.alt}
              className="max-w-full max-h-full object-contain"
              style={{
                filter: isLoaded ? "none" : "blur(20px)",
                transition: "filter 0.5s ease-out",
              }}
              loading="eager"
              onLoad={handleImageLoad}
              decoding="async"
              fetchPriority="high"
            />
          </div>

          {/* Image Info */}
          <div className="absolute bottom-0 left-0 right-0">
            {/* Filename Popup */}
            <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
              {selectedImage.src.split("/").pop()}
            </div>

            {/* Toggle Button */}
            <button
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-300 z-20"
              onClick={() => setShowLabels(!showLabels)}
              aria-label={
                showLabels ? "Hide image information" : "Show image information"
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-6 w-6 transform transition-transform duration-300 ${
                  showLabels ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Info Panel */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: showLabels ? "0%" : "100%" }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="bg-gradient-to-t from-black to-transparent p-8 pb-18 text-white text-center"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">
                  {selectedImage.event}
                </h2>
                <p className="text-lg opacity-90">
                  📍 {selectedImage.location}
                </p>
                <p className="text-lg opacity-80">
                  Date : {selectedImage.date}
                </p>
                {selectedImage.photographerLink &&
                selectedImage.photographerLink !== "#" ? (
                  <Link
                    href={selectedImage.photographerLink}
                    className="text-lg opacity-70 hover:opacity-100 transition-opacity inline-flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Photographer:{" "}
                    <span className="font-serif italic underline">
                      {selectedImage.photographer}
                    </span>
                  </Link>
                ) : (
                  <p className="text-lg opacity-70 inline-flex items-center gap-1">
                    Photographer:{" "}
                    <span className="font-serif italic">
                      {selectedImage.photographer}
                    </span>
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    );
  }
);

FullscreenViewer.displayName = "FullscreenViewer";

export default FullscreenViewer;
