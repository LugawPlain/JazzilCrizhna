"use client";
import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
  use,
} from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import Link from "next/link";
import { FiSettings, FiGrid, FiColumns } from "react-icons/fi";

interface ImageData {
  src: string;
  alt: string;
  date: string;
  photographer: string;
  photographerLink: string;
  location: string;
  event: string;
  blurDataUrl?: string; // Added for blur placeholder
}

// Function to generate a blur placeholder
const generateBlurPlaceholder = (width: number, height: number): string => {
  // Create a small SVG with a gradient that mimics a blurred image
  const svg = `
    <svg width="${width}" height="${height}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <linearGradient id="g">
          <stop stop-color="#333" offset="20%" />
          <stop stop-color="#222" offset="50%" />
          <stop stop-color="#333" offset="70%" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#g)" />
      <rect id="r" width="${width}" height="${height}" fill="url(#g)" fill-opacity="0.1" />
      <animate xlink:href="#r" attributeName="x" from="-${width}" to="${width}" dur="1s" repeatCount="indefinite" />
    </svg>
  `;

  // Convert SVG to base64
  const toBase64 = (str: string) =>
    typeof window === "undefined"
      ? Buffer.from(str).toString("base64")
      : window.btoa(str);

  return `data:image/svg+xml;base64,${toBase64(svg)}`;
};

// Memoized ImageCard component to prevent unnecessary re-renders
const ImageCard = React.memo(
  ({
    image,
    index,
    totalColumns,
    onImageClick,
  }: {
    image: ImageData;
    index: number;
    totalColumns: number;
    onImageClick: (image: ImageData, index: number) => void;
  }) => {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    const [isLoaded, setIsLoaded] = useState(false);
    const [isBlurLoaded, setIsBlurLoaded] = useState(false);
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
                onLoad={() => setIsBlurLoaded(true)}
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

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end">
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
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
);

ImageCard.displayName = "ImageCard";

// Memoized FullscreenViewer component
const FullscreenViewer = React.memo(
  ({
    selectedImage,
    onClose,
    onNext,
    onPrev,
  }: {
    selectedImage: ImageData;
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
  }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isBlurLoaded, setIsBlurLoaded] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    // Generate a unique blur placeholder for this image
    const blurPlaceholder = useMemo(() => {
      return generateBlurPlaceholder(1200, 800);
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center"
      >
        <div className="relative w-full h-full flex flex-col items-center">
          {/* Navigation Arrows */}
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-4xl hover:text-gray-300 transition-colors z-10"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
          >
            ←
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-4xl hover:text-gray-300 transition-colors z-10"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
          >
            →
          </button>

          {/* Close Button */}
          <button
            className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 transition-colors z-10"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
          >
            ✕
          </button>

          {/* Image */}
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
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-8 text-white text-center">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">{selectedImage.event}</h2>
              <p className="text-lg opacity-90">📍 {selectedImage.location}</p>
              <p className="text-lg opacity-80">
                {new Date(selectedImage.date).toLocaleDateString()}
              </p>
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
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
);

FullscreenViewer.displayName = "FullscreenViewer";

export default function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = use(params);

  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [userColumnCount, setUserColumnCount] = useState<number | null>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Function to capitalize first letter - memoized
  const capitalizeFirstLetter = useCallback((string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }, []);

  // Fetch images on component mount
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch(`/api/images/${category}`);
        const data = await response.json();

        // Pre-fetch images for better performance
        const preloadImages = async (imageUrls: string[]) => {
          // Create a queue to load images in batches to avoid overwhelming the browser
          const batchSize = 3;
          const batches = [];

          for (let i = 0; i < imageUrls.length; i += batchSize) {
            batches.push(imageUrls.slice(i, i + batchSize));
          }

          // Process batches sequentially
          for (const batch of batches) {
            const promises = batch.map((url) => {
              return new Promise((resolve) => {
                const img = new window.Image();
                img.src = url;
                img.onload = resolve;
                img.onerror = resolve; // Resolve even on error to not block other images
              });
            });

            // Wait for the current batch to complete before moving to the next
            await Promise.all(promises);
          }
        };

        const formattedImages = data.images.map(
          (img: string, index: number) => ({
            src: `/categories/${data.imageData.category || category}/${img}`,
            alt: `${category} image ${index + 1}`,
            date: new Date(2024, 2, 15 + index).toISOString().split("T")[0],
            photographer: `Photographer ${index + 1}`,
            photographerLink: `#`, // Changed to a hash link since photographer pages don't exist
            location: `Location ${index + 1}`,
            event: `Event ${index + 1}`,
          })
        );

        setImages(formattedImages);

        // Start preloading images in the background
        preloadImages(formattedImages.map((img: ImageData) => img.src));
      } catch (error) {
        console.error("Error fetching images:", error);
      } finally {
        setLoading(false);
      }
    };

    if (category) {
      fetchImages();
    }
  }, [category]);

  const handleClose = useCallback(() => {
    setSelectedImage(null);
    setCurrentIndex(0);
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, images.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose, handleNext, handlePrev]);

  // Memoized handlers
  const handleImageClick = useCallback(
    async (image: ImageData, index: number) => {
      setSelectedImage(image);
      setCurrentIndex(index);
      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.error("Error entering fullscreen:", err);
      }
    },
    []
  );

  // Memoized distributeImages function
  const distributeImages = useCallback(
    (numColumns: number) => {
      const columns = Array.from(
        { length: numColumns },
        () => [] as ImageData[]
      );
      images.forEach((image, index) => {
        const columnIndex = index % numColumns;
        columns[columnIndex].push(image);
      });
      return columns;
    },
    [images]
  );

  // Memoized column layouts
  const columnLayouts = useMemo(() => {
    return {
      mobile: distributeImages(1),
      smallTablet: distributeImages(2),
      tablet: distributeImages(3),
      largeTablet: distributeImages(4),
      desktop: distributeImages(5),
    };
  }, [distributeImages]);

  // Close settings when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      ) {
        setShowSettings(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!category) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <h1 className="text-white text-2xl">Category not found</h1>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  // Determine which layout to use based on user selection or screen size
  const getActiveLayout = () => {
    if (userColumnCount) {
      return distributeImages(userColumnCount);
    }

    // Default responsive layouts
    if (window.innerWidth < 640) return columnLayouts.mobile;
    if (window.innerWidth < 768) return columnLayouts.smallTablet;
    if (window.innerWidth < 1280) return columnLayouts.tablet;
    if (window.innerWidth < 1536) return columnLayouts.largeTablet;
    return columnLayouts.desktop;
  };

  const activeLayout = getActiveLayout();
  const activeColumnCount =
    userColumnCount ||
    (window.innerWidth < 640
      ? 1
      : window.innerWidth < 768
      ? 2
      : window.innerWidth < 1280
      ? 3
      : window.innerWidth < 1536
      ? 4
      : 5);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-neutral-900 py-20"
    >
      <div className="mx-auto px-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            {capitalizeFirstLetter(category)}
          </h1>
          <p className="text-gray-400">
            My {capitalizeFirstLetter(category)} Portfolio 🥰
          </p>
        </motion.div>

        {/* Dynamic Column Layout */}
        <div className="flex flex-row justify-between gap-4">
          {activeLayout.map((column, columnIndex) => (
            <div
              key={`col-${activeColumnCount}-${columnIndex}`}
              className="flex-col relative space-y-4 flex"
              style={{ width: `${100 / activeColumnCount - 2}%` }}
            >
              {column.map((image, index) => (
                <ImageCard
                  key={`${image.src}-${columnIndex}-${index}`}
                  image={image}
                  index={columnIndex + index * activeColumnCount}
                  totalColumns={activeColumnCount}
                  onImageClick={handleImageClick}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Floating Settings Panel */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
        <div className="relative" ref={settingsRef}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="bg-neutral-800 hover:bg-neutral-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center"
            aria-label="Settings"
          >
            <FiSettings className="text-xl" />
          </button>

          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-neutral-800 rounded-lg shadow-xl p-4 w-64"
              >
                <h3 className="text-white font-medium mb-3 flex items-center">
                  <FiGrid className="mr-2" /> Layout Settings
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-gray-300 text-sm block mb-2">
                      Number of Columns
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5].map((count) => (
                        <button
                          key={count}
                          onClick={() => {
                            setUserColumnCount(count);
                            setShowSettings(false);
                          }}
                          className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
                            activeColumnCount === count
                              ? "bg-blue-600 text-white"
                              : "bg-neutral-700 text-gray-300 hover:bg-neutral-600"
                          }`}
                          aria-label={`${count} columns`}
                        >
                          <FiColumns className="text-sm" />
                          <span className="ml-1 text-xs">{count}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-neutral-700">
                    <button
                      onClick={() => {
                        setUserColumnCount(null);
                        setShowSettings(false);
                      }}
                      className="text-sm text-gray-300 hover:text-white transition-colors"
                    >
                      Reset to Default
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Fullscreen Image Viewer */}
      <AnimatePresence>
        {selectedImage && (
          <FullscreenViewer
            selectedImage={selectedImage}
            onClose={handleClose}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
