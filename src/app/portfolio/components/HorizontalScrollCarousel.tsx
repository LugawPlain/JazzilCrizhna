import { useEffect, useRef } from "react";
import Link from "next/link";
import { categories, CategoryData } from "../CategoryData";
import { ProjectCard } from "./ProjectCard";

export const HorizontalScrollCarousel = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;

    const handleWheel = (e: WheelEvent) => {
      if (scrollContainer) {
        e.preventDefault();
        scrollContainer.scrollLeft += e.deltaY;
      }
    };

    scrollContainer?.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      scrollContainer?.removeEventListener("wheel", handleWheel);
    };
  }, []);

  return (
    <div className="relative bg-neutral-900 pt-20 lg:pt-4 pb-24">
      <div
        ref={scrollContainerRef}
        className="flex flex-row gap-8 p-10 lg:pt-25 lg:pb-5 max-w-screen overflow-auto scrollbar-thin scrollbar-track-red-500 md:scrollbar-thumb-red-500  md:scrollbar-track-black md:hover:scrollbar-thumb-amber-500 snap-x snap-mandatory md:snap-none"
      >
        {categories.map((project: CategoryData) => (
          <div
            key={project.category}
            className="snap-center md:snap-align-none"
          >
            <Link href={`/portfolio/${project.category.toLowerCase()}`}>
              <ProjectCard project={project} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};
