"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { categories } from "../CategoryData";

interface CategoryPageProps {
  params: {
    category: string;
  };
}

interface ImageData {
  src: string;
  alt: string;
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);

  const category = categories.find(
    (cat) => cat.category.toLowerCase() === params.category
  );

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch(`/api/images/${params.category}`);
        const data = await response.json();

        const formattedImages = data.images.map(
          (img: string, index: number) => ({
            src: `/${params.category}/${img}`,
            alt: `${category?.category} Image ${index + 1}`,
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
  }, [params.category, category]);

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

  // Function to distribute images based on number of columns
  const distributeImages = (numColumns: number) => {
    const columns = Array.from({ length: numColumns }, () => [] as ImageData[]);
    images.forEach((image, index) => {
      const columnIndex = index % numColumns;
      columns[columnIndex].push(image);
    });
    return columns;
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
            {category.category}
          </h1>
        </motion.div>

        {/* Mobile - 1 column */}
        <div className="block sm:hidden">
          <div className="flex flex-col space-y-4">
            {images.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-lg overflow-hidden"
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-auto object-cover"
                />
              </motion.div>
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
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (columnIndex + index * 2) * 0.1 }}
                    className="rounded-lg overflow-hidden"
                  >
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-auto object-cover"
                    />
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Tablets - 3 columns */}
        <div className="hidden md:block lg:hidden">
          <div className="flex flex-row justify-between gap-4">
            {distributeImages(3).map((column, columnIndex) => (
              <div
                key={columnIndex}
                className="flex-col relative space-y-4 flex w-[31%]"
              >
                {column.map((image, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (columnIndex + index * 3) * 0.1 }}
                    className="rounded-lg overflow-hidden"
                  >
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-auto object-cover"
                    />
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Desktop - 4 columns */}
        <div className="hidden lg:flex flex-row justify-between gap-4">
          {distributeImages(4).map((column, columnIndex) => (
            <div
              key={columnIndex}
              className="flex-col relative space-y-4 flex w-[23%]"
            >
              {column.map((image, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (columnIndex + index * 4) * 0.1 }}
                  className="rounded-lg overflow-hidden"
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-auto object-cover"
                  />
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
