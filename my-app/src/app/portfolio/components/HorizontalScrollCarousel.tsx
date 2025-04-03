import { motion, useTransform, useScroll } from "framer-motion";
import React, { useRef } from "react";
import Link from "next/link";
import { categories, CategoryData } from "../CategoryData";
import { ProjectCard } from "./ProjectCard";

export const HorizontalScrollCarousel = () => {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  const x = useTransform(scrollYProgress, [0, 1], ["5%", "-50%"]);
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
        <div className="sticky top-20 flex items-center overflow-hidden">
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
          className="fixed bottom-0 left-0 right-0 h-1 bg-neutral-700/30"
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
