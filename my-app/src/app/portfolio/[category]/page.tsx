"use client";
import React, { useEffect, useState, useRef, use } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import Image from "next/image";
import { categories } from "../CategoryData";
import Link from "next/link";
import { useRouter } from "next/router";

interface ImageData {
  src: string;
  alt: string;
  date: string;
  photographer: string;
  photographerLink: string;
  location: string;
  event: string;
}

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

  // Function to capitalize first letter
  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch(`/api/images/${category}`);
        const data = await response.json();
        const mockMetadata = {
          date: "2024-03-15",
          photographer: "John Doe",
          photographerLink: "/photographers/john-doe",
          location: "New York City",
          event: "Spring Fashion Show",
        };
        const formattedImages = data.images.map(
          (img: string, index: number) => ({
            src: `/categories/${category}/${img}`,
            alt: `${category} image ${index + 1}`,
            ...mockMetadata,
            date: new Date(2024, 2, 15 + index).toISOString().split("T")[0],
            photographer: `Photographer ${index + 1}`,
            photographerLink: `/photographers/photographer-${index + 1}`,
            location: `Location ${index + 1}`,
            event: `Event ${index + 1}`,
          })
        );
        setImages(formattedImages);
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImage) {
        if (e.key === "Escape") {
          e.preventDefault();
          handleClose();
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          handlePrev();
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          handleNext();
        }
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [selectedImage, currentIndex]);

  const handleImageClick = async (image: ImageData, index: number) => {
    setSelectedImage(image);
    setCurrentIndex(index);
    try {
      // Request fullscreen for the entire document
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch (err) {
      console.error("Error entering fullscreen:", err);
    }
  };

  const handleClose = async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (err) {
        console.error("Error exiting fullscreen:", err);
      }
    }
    setSelectedImage(null);
    setIsFullscreen(false);

    // Prevent default behavior that might cause page reload
    return false;
  };

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % images.length;
    setCurrentIndex(nextIndex);
    setSelectedImage(images[nextIndex]);
  };

  const handlePrev = () => {
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    setCurrentIndex(prevIndex);
    setSelectedImage(images[prevIndex]);
  };

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

  const distributeImages = (numColumns: number) => {
    const columns = Array.from({ length: numColumns }, () => [] as ImageData[]);
    images.forEach((image, index) => {
      const columnIndex = index % numColumns;
      columns[columnIndex].push(image);
    });
    return columns;
  };

  const ImageCard = ({
    image,
    index,
    totalColumns,
  }: {
    image: ImageData;
    index: number;
    totalColumns: number;
  }) => {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

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
        onClick={() => handleImageClick(image, images.indexOf(image))}
      >
        <div className="relative">
          <motion.img
            src={image.src}
            alt={image.alt}
            className="w-full h-auto object-cover transition-all duration-500 group-hover:scale-110 group-hover:blur-xs"
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
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
  };

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

        {/* Mobile - 1 column */}
        <div className="block sm:hidden">
          <div className="flex flex-col space-y-4">
            {images.map((image, index) => (
              <ImageCard
                key={index}
                image={image}
                index={index}
                totalColumns={1}
              />
            ))}
          </div>
        </div>

        {/* Small tablets - 2 columns */}
        <div className="hidden sm:block md:hidden">
          <div className="flex flex-row justify-between gap-4">
            {distributeImages(2).map((column, columnIndex) => (
              <div
                key={columnIndex}
                className="flex-col relative space-y-4 flex w-[48%]"
              >
                {column.map((image, index) => (
                  <ImageCard
                    key={index}
                    image={image}
                    index={columnIndex + index * 2}
                    totalColumns={2}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Tablets - 3 columns */}
        <div className="hidden md:block xl:hidden">
          <div className="flex flex-row justify-between gap-4">
            {distributeImages(3).map((column, columnIndex) => (
              <div
                key={columnIndex}
                className="flex-col relative space-y-4 flex w-[31%]"
              >
                {column.map((image, index) => (
                  <ImageCard
                    key={index}
                    image={image}
                    index={columnIndex + index * 3}
                    totalColumns={3}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Large tablets/Small desktops - 4 columns */}
        <div className="hidden xl:block 2xl:hidden">
          <div className="flex flex-row justify-between gap-4">
            {distributeImages(4).map((column, columnIndex) => (
              <div
                key={columnIndex}
                className="flex-col relative space-y-4 flex w-[23%]"
              >
                {column.map((image, index) => (
                  <ImageCard
                    key={index}
                    image={image}
                    index={columnIndex + index * 4}
                    totalColumns={4}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Large desktops - 5 columns */}
        <div className="hidden 2xl:flex flex-row justify-between gap-4">
          {distributeImages(5).map((column, columnIndex) => (
            <div
              key={columnIndex}
              className="flex-col relative space-y-4 flex w-[18%]"
            >
              {column.map((image, index) => (
                <ImageCard
                  key={index}
                  image={image}
                  index={columnIndex + index * 5}
                  totalColumns={5}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Fullscreen Image Viewer */}
      <AnimatePresence>
        {selectedImage && (
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
                  handlePrev();
                }}
              >
                ←
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-4xl hover:text-gray-300 transition-colors z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
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
                  handleClose();
                }}
              >
                ✕
              </button>

              {/* Image */}
              <div className="relative w-full h-full flex items-center justify-center">
                <motion.img
                  key={selectedImage.src}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  src={selectedImage.src}
                  alt={selectedImage.alt}
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              {/* Image Info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-8 text-white text-center">
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold">
                    {selectedImage.event}
                  </h2>
                  <p className="text-lg opacity-90">
                    📍 {selectedImage.location}
                  </p>
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
        )}
      </AnimatePresence>
    </motion.div>
  );
}
