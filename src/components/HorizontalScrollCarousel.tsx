"use client"; // Ensure this is a client component

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
// REMOVED: import { categories, CategoryData } from "../app/portfolio/CategoryData";
import { ProjectCard } from "./ProjectCard";

// Define the structure fetched from /api/fetch-project-images
// This aligns with ProjectCardData from the API route
interface ProjectCardData {
  category: string;
  imageSrc: string;
  title?: string;
  link?: string;
  photographer?: string | null;
  photographerLink?: string | null;
}

export const HorizontalScrollCarousel = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // State for fetched data, loading, and errors
  // Use the corrected interface name
  const [projectImages, setProjectImages] = useState<ProjectCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Ref to track if the listener is currently attached
  const listenerAttachedRef = useRef(false);

  // Fetch data on component mount from the correct endpoint
  useEffect(() => {
    const fetchProjectImagesData = async () => {
      setLoading(true);
      setError(null);

      const cacheKey = "projectImagesCache";

      try {
        // Try to load from localStorage first
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          console.log(
            "[HorizontalScrollCarousel] Loaded project images from localStorage."
          );
          const parsedData = JSON.parse(cachedData);
          // Basic validation, ensure it matches the expected structure
          if (parsedData && Array.isArray(parsedData.projectImages)) {
            setProjectImages(parsedData.projectImages);
            setLoading(false); // Data loaded from cache
            // Optionally, you could re-fetch in the background to update cache
            // without showing loading again, but we'll keep it simple for now.
            return; // Exit early as we've loaded from cache
          } else {
            console.warn(
              "[HorizontalScrollCarousel] Invalid cached data format, removing from cache."
            );
            localStorage.removeItem(cacheKey); // Remove invalid cache
          }
        }

        // If not in cache or cache was invalid, fetch from API
        console.log(
          "[HorizontalScrollCarousel] Fetching project images from /api/fetch-project-images..."
        );
        const response = await fetch("/api/fetch-project-images");
        if (!response.ok) {
          throw new Error(
            `API Error: ${response.status} ${response.statusText}`
          );
        }
        const data = await response.json();
        if (!data || !Array.isArray(data.projectImages)) {
          console.error(
            "[HorizontalScrollCarousel] Invalid data format received:",
            data
          );
          throw new Error("Invalid data format received from API.");
        }
        console.log(
          `[HorizontalScrollCarousel] Received ${data.projectImages.length} project images.`
        );
        setProjectImages(data.projectImages);

        // Save to localStorage for next time
        try {
          localStorage.setItem(
            cacheKey,
            JSON.stringify({ projectImages: data.projectImages })
          );
          console.log(
            "[HorizontalScrollCarousel] Saved project images to localStorage."
          );
        } catch (cacheError) {
          console.error(
            "[HorizontalScrollCarousel] Failed to save project images to localStorage:",
            cacheError
          );
          // If localStorage is full or disabled, this might fail.
          // The app will still work, but data won't be cached.
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load project images.";
        setError(message);
        console.error(
          "[HorizontalScrollCarousel] Error fetching project images:",
          err
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProjectImagesData();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Define the wheel handler using useCallback to keep its reference stable
  const handleWheel = useCallback((e: WheelEvent) => {
    const container = scrollContainerRef.current;
    if (container) {
      // Prevent default vertical page scroll ONLY when handling the event here
      e.preventDefault();
      container.scrollLeft += e.deltaY;
    }
  }, []); // No dependencies needed as it only uses the ref

  // Attach listener on mouse enter
  const handleMouseEnter = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container && !listenerAttachedRef.current) {
      console.log("[HorizontalScrollCarousel] Attaching wheel listener.");
      container.addEventListener("wheel", handleWheel, { passive: false });
      listenerAttachedRef.current = true;
    }
  }, [handleWheel]); // Depends on handleWheel's stable reference

  // Detach listener on mouse leave
  const handleMouseLeave = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container && listenerAttachedRef.current) {
      console.log("[HorizontalScrollCarousel] Removing wheel listener.");
      container.removeEventListener("wheel", handleWheel);
      listenerAttachedRef.current = false;
    }
  }, [handleWheel]); // Depends on handleWheel's stable reference

  // Effect for cleanup on unmount
  useEffect(() => {
    // Store the current ref value and the handler in variables
    // that the cleanup function can close over.
    const container = scrollContainerRef.current;
    const currentHandleWheel = handleWheel;
    const listenerAttached = listenerAttachedRef.current;

    return () => {
      if (listenerAttached && container) {
        console.log(
          "[HorizontalScrollCarousel] Cleaning up wheel listener on unmount."
        );
        container.removeEventListener("wheel", currentHandleWheel);
        // No need to set listenerAttachedRef.current = false here, component is gone
      }
    };
  }, [handleWheel]); // Rerun if handleWheel changes (it shouldn't due to useCallback)

  // Render Loading State
  if (loading) {
    return (
      <div className="relative bg-neutral-900 p-10 text-center text-neutral-400 min-h-[200px] flex items-center justify-center">
        Loading projects...
      </div>
    );
  }

  // Render Error State
  if (error) {
    return (
      <div className="relative bg-neutral-900 p-10 text-center text-red-500 min-h-[200px] flex items-center justify-center">
        Error loading projects: {error}
      </div>
    );
  }

  // Render No Projects Found State
  if (projectImages.length === 0) {
    return (
      <div className="relative bg-neutral-900 p-10 text-center text-neutral-500 min-h-[200px] flex items-center justify-center">
        No project cover images found.
      </div>
    );
  }

  // Render Carousel with Fetched Data
  return (
    <div className="relative bg-neutral-900">
      {" "}
      {/* Keep outer container if needed */}
      <div
        ref={scrollContainerRef}
        className="flex flex-row gap-8 p-10 max-w-screen overflow-auto scrollbar-thin scrollbar-track-red-500 md:scrollbar-thumb-red-500 md:scrollbar-track-black md:hover:scrollbar-thumb-amber-500 snap-x snap-mandatory md:snap-none"
        // Add mouse event handlers
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Map over the fetched projectImages state */}
        {projectImages.map((project) => (
          <div
            key={project.category} // Use category as key
            className="snap-center md:snap-align-none min-h-4/5"
          >
            {/* Use the link generated by the API or default */}
            <Link
              href={
                project.link || `/portfolio/${project.category.toLowerCase()}`
              }
            >
              {/* Map fetched data to the props expected by ProjectCard */}
              <ProjectCard
                project={{
                  // Fields likely expected by ProjectCard based on old CategoryData/linter error:
                  category: project.category,
                  title: project.title || project.category, // Use title or fallback to category
                  image: project.imageSrc, // Map imageSrc from API to 'image' prop
                  link:
                    project.link ||
                    `/portfolio/${project.category.toLowerCase()}`, // Map link from API to 'link' prop
                  // Provide fallback empty string for potentially null/undefined values
                  photographer: project.photographer || "",
                  photographerlink: project.photographerLink || "", // Map photographerLink to 'photographerlink' (lowercase L)
                  // Add any other required fields from the original CategoryData if needed
                }}
              />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};
