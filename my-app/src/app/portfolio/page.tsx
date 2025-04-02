"use client";
import { motion, useTransform, useScroll } from "framer-motion";
import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { categories, Category } from "./category";

const Portfolio = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="bg-neutral-900"
    >
      <HorizontalScrollCarousel />
      <div className="flex h-48 items-center justify-center px-4 bg-neutral-800">
        <p className="font-light text-neutral-400 text-sm text-center max-w-2xl leading-relaxed">
          Copyright © {new Date().getFullYear()} Jazzil Crizhna Sarinas. All
          Rights Reserved.
          <br />
          <span className="text-neutral-500 text-xs">
            All material on this site may not be reproduced, distributed, cached
            or otherwise used, except with prior written permission.
          </span>
        </p>
      </div>
    </motion.div>
  );
};

const HorizontalScrollCarousel = () => {
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
            {categories.map((project: Category, index: number) => (
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

const ProjectCard = ({ project }: { project: Category }) => {
  return (
    <div
      className="group relative flex-shrink-0 cursor-pointer"
      style={{
        width: "min(375px, 52vw)",
        aspectRatio: "9/16",
      }}
    >
      <div className="absolute inset-0 overflow-hidden rounded-lg">
        <Image
          src={project.image}
          alt={project.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transform transition-transform duration-700 group-hover:scale-110"
          priority={false}
        />

        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 -rotate-90 origin-center">
            <span className="text-white/60 tracking-widest text-sm">
              VIEW PROJECT
            </span>
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-bold text-2xl tracking-wider transform translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
              {project.category}
            </span>
          </div>

          <div className="absolute bottom-4 right-4 text-right">
            <h3 className="text-white text-lg font-medium transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100">
              {project.title}
            </h3>
            <p className="text-white/80 font-serif text-sm transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-200">
              {project.photographer}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
