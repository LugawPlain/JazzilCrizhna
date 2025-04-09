"use client";
import React, { useState, useRef, useMemo } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { generateBlurPlaceholder } from "@/lib/utils";

interface ImageData {
  src: string;
  alt: string;
  event: string;
  location: string;
  date: string;
  photographer: string;
  photographerLink: string;
}

interface ImageCardProps {
  image: ImageData;
  index: number;
  totalColumns: number;
  onImageClick: (image: ImageData, index: number) => void;
}

const ImageCard = React.memo(
  ({ image, index, totalColumns, onImageClick }: ImageCardProps) => {
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
        className="rounded-lg overflow-hidden group relative cursor-pointer"
        onClick={() => onImageClick(image, index)}
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
            src={image.src}
            alt={image.alt}
            className={`w-full h-auto object-cover transition-all duration-500 group-hover:scale-110 group-hover:blur-xs ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
            style={{
              filter: isLoaded ? "none" : "blur(20px)",
              transition: "filter 0.5s ease-out",
            }}
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
            loading={index < 4 ? "eager" : "lazy"} // Prioritize first 4 images
            onLoad={handleImageLoad}
            decoding="async"
            fetchPriority={index < 4 ? "high" : "low"}
          />

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
                <p className="text-xl font-semibold">Event: {image.event}</p>
                <p className="text-sm opacity-90">📍: {image.location}</p>
                <p className="text-sm opacity-80">Date: {image.date}</p>
                {image.photographerLink && image.photographerLink !== "#" ? (
                  <Link
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
