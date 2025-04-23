"use client";
import React, { useState, useRef, useMemo } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { generateBlurPlaceholder } from "@/utils/generateBlurPlaceholder";

interface ImageData {
  src: string;
  alt: string;
  event: string;
  location: string;
  eventDate: string;
  date?: string;
  photographer: string;
  photographerLink: string;
  id?: string;
  r2FileKey?: string;
}

interface ImageCardProps {
  image: ImageData;
  index: number;
  totalColumns: number;
  onImageClick: (image: ImageData, index: number) => void;
  isAdmin?: boolean;
  pinned?: boolean;
  onPinClick?: (image: ImageData) => void;
  isSelecting?: boolean;
  isSelected?: boolean;
  onImageSelectToggle?: (imageKey: string) => void;
}

const ImageCard = React.memo(
  ({
    image,
    index,
    totalColumns,
    onImageClick,
    isAdmin = false,
    pinned = false,
    onPinClick,
    isSelecting = false,
    isSelected = false,
    onImageSelectToggle,
  }: ImageCardProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    const [isLoaded, setIsLoaded] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    // Generate a unique blur placeholder for this image
    const blurPlaceholder = useMemo(() => {
      // Use a fixed aspect ratio for the placeholder
      return generateBlurPlaceholder(800, 600);
    }, []);

    // Handle image load with progressive enhancement
    const handleImageLoad = () => {
      setIsLoaded(true);
      // Add a small delay before showing the full image for a smoother transition
      setTimeout(() => {
        if (imgRef.current) {
          imgRef.current.style.filter = "none";
        }
      }, 100);
    };

    // Optimize image source for GitHub LFS and Cloudflare
    const optimizedSrc = useMemo(() => {
      // For GitHub LFS through Cloudflare, we can use the raw URL directly
      // It will be properly cached by our Cloudflare worker
      return image.src;
    }, [image.src]);

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{
          duration: 0.6,
          delay:
            ((index % totalColumns) +
              Math.floor(index / totalColumns) * totalColumns) *
            0.1,
          ease: [0.25, 0.1, 0.25, 1],
        }}
        className="rounded-lg overflow-hidden group relative cursor-pointer shadow-md hover:shadow-xl transition-shadow duration-300"
        onClick={() => {
          if (isSelecting && image.r2FileKey) {
            onImageSelectToggle?.(image.r2FileKey);
          } else if (!isSelecting) {
            onImageClick(image, index);
          }
        }}
      >
        <div className="relative">
          {/* Blur placeholder */}
          {!isLoaded && (
            <div className="absolute inset-0 bg-gray-800">
              <img
                src={blurPlaceholder}
                alt="Loading..."
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <motion.img
            ref={imgRef}
            src={optimizedSrc}
            alt={image.alt}
            className={`
              w-full h-auto object-cover
              transition-all duration-500 ease-out 
              group-hover:scale-110 
              ${isLoaded ? "opacity-100 blur-none" : "opacity-0 blur-xl"} 
            `}
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
            loading={index < 4 ? "eager" : "lazy"} // Prioritize first 4 images
            onLoad={handleImageLoad}
            decoding="async"
            fetchPriority={index < 4 ? "high" : "low"}
          />

          {/* Selection Overlay */}
          {isSelecting && (
            <div
              className={`absolute inset-0 z-20 transition-colors duration-200 ${
                isSelected
                  ? "bg-black/50 border-4 border-blue-500"
                  : "bg-black/20 group-hover:bg-black/40"
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 left-2 bg-blue-500 text-white rounded-full p-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          )}

          {/* Admin Pin Star Overlay (Placeholder) */}
          {isAdmin && (
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering onImageClick
                onPinClick?.(image);
              }}
              className="absolute top-2 right-2 z-10 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/75 focus:outline-none"
              aria-label={pinned ? "Unpin image" : "Pin image"}
            >
              {/* Star SVG will go here */}
              {pinned ? (
                // Filled Star SVG Placeholder
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6 text-yellow-400"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                // Outline Star SVG Placeholder
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
                    d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.31h5.518a.562.562 0 0 1 .329.958l-4.48 3.261a.564.564 0 0 0-.186.618l1.708 5.332a.562.562 0 0 1-.827.623l-4.54-2.738a.563.563 0 0 0-.626 0l-4.54 2.738a.562.562 0 0 1-.827-.623l1.708-5.332a.564.564 0 0 0-.186-.618L2.43 9.88a.562.562 0 0 1 .329-.958h5.518a.563.563 0 0 0 .475-.31L11.48 3.5Z"
                  />
                </svg>
              )}
            </button>
          )}

          {/* Image Info Overlay */}
          <div
            className="absolute inset-0
            bg-gradient-to-t from-black/80 via-black/40 to-transparent
            opacity-0 group-hover:opacity-100                   
            pointer-events-none group-hover:pointer-events-auto     
            transition-opacity duration-500
            flex items-end"
          >
            <div className="text-white p-6 w-full">
              <motion.div
                className="space-y-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500"
                initial={{ opacity: 0, y: 20 }}
                animate={
                  isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
                }
                transition={{ delay: 0.3 }}
              >
                <p className="text-xl font-semibold">
                  Event:{" "}
                  <span className="text-md font-mono  ">{image.event}</span>
                </p>
                <p className="text-xs opacity-90">
                  📍: <span className="text-sm">{image.location}</span>
                </p>
                <p className="text-xs opacity-80">
                  Date:{" "}
                  <span className="text-sm">
                    {image.eventDate || image.date}
                  </span>
                </p>
                {image.photographerLink && image.photographerLink !== "#" ? (
                  <Link
                    target="_blank"
                    rel="noopener noreferrer"
                    href={image.photographerLink}
                    className="text-sm opacity-70 hover:opacity-100 transition-opacity inline-flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Photographer:{" "}
                    <span className="font-serif italic underline">
                      {image.photographer}
                    </span>
                  </Link>
                ) : (
                  <p className="text-sm opacity-70 inline-flex items-center gap-1">
                    Photographer:{" "}
                    <span className="font-serif italic">
                      {image.photographer}
                    </span>
                  </p>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
);

ImageCard.displayName = "ImageCard";

export default ImageCard;
