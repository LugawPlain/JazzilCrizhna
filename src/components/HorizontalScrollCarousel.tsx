import { useEffect, useRef } from "react";
import Link from "next/link";
import { categories, CategoryData } from "../app/portfolio/CategoryData";
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
    <div
      ref={scrollContainerRef}
      className="flex flex-row gap-8 p-10  max-w-screen overflow-auto scrollbar-thin scrollbar-track-red-500 md:scrollbar-thumb-red-500  md:scrollbar-track-black md:hover:scrollbar-thumb-amber-500 snap-x snap-mandatory md:snap-none"
    >
      {categories.map((project: CategoryData) => (
        <div
          key={project.category}
          className="snap-center md:snap-align-none min-h-4/5"
        >
          <Link href={`/portfolio/${project.category.toLowerCase()}`}>
            <ProjectCard project={project} />
          </Link>
        </div>
      ))}
    </div>
  );
};
