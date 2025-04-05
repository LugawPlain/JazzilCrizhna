import { motion, useTransform, useScroll } from "framer-motion";
import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { categories, CategoryData } from "../CategoryData";
import { ProjectCard } from "./ProjectCard";

export const HorizontalScrollCarousel = () => {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  // Add state to track screen width
  const [scrollValue, setScrollValue] = useState("-40%");

  // Update scroll value based on screen width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        // sm breakpoint
        setScrollValue("-90%");
      } else if (window.innerWidth < 768) {
        // md breakpoint
        setScrollValue("-80%");
      } else if (window.innerWidth < 1024) {
        // lg breakpoint
        setScrollValue("-75%");
      } else {
        setScrollValue("-70%");
      }
    };

    // Set initial value
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const x = useTransform(scrollYProgress, [0, 1], ["0%", scrollValue]);
  const progress = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <>
      <motion.section
        ref={targetRef}
        className="relative h-[300vh] bg-neutral-900"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        <div className="sticky top-20 flex items-center overflow-hidden pl-10 lg:pl-20">
          <motion.div
            style={{ x }}
            className="py-4 flex gap-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            {categories.map((project: CategoryData, index: number) => (
              <motion.div
                key={project.category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 * index, duration: 0.5 }}
              >
                <Link href={`/portfolio/${project.category.toLowerCase()}`}>
                  <ProjectCard project={project} />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Scroll Progress Indicator */}
        <motion.div
          className="fixed bottom-0 left-0 right-0 h-2 bg-neutral-700/30"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <motion.div
            className="h-full"
            style={{
              width: "100%",
              scaleX: progress,
              transformOrigin: "left",
              background: "linear-gradient(90deg, #FFD700, #FF0000, #000000)",
            }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 30,
              restDelta: 0.001,
            }}
          />
        </motion.div>
      </motion.section>
    </>
  );
};
