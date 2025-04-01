"use client";
import { useScroll, useTransform } from "framer-motion";
import React, { useRef, useState } from "react";
import { motion } from "framer-motion";

export default function Portfolio() {
  const projects = [
    {
      title: "Project 1",
      image: "/project1.jpg",
      category: "PAGEANT",
      link: "#",
    },
    {
      title: "Project 2",
      image: "/project2.jpg",
      category: "MODELS",
      link: "#",
    },
    {
      title: "Project 3",
      image: "/project3.jpg",
      category: "ADVERTISING",
      link: "#",
    },
    {
      title: "Project 4",
      image: "/project4.jpg",
      category: "CLOTHING",
      link: "#",
    },
    {
      title: "Project 5",
      image: "/project5.jpg",
      category: "MUSE",
      link: "#",
    },
    {
      title: "Project 6",
      image: "/project6.jpg",
      category: "PHOTOSHOOTS",
      link: "#",
    },
  ];

  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  });

  const x = useTransform(scrollYProgress, [0, 1], ["5%", "-70%"]);

  return (
    <div className="bg-neutral-800">
      <div className="flex h-24 items-center justify-center">
        <span className="font-semibold uppercase text-neutral-500">
          Scroll down
        </span>
      </div>
      <main className="min-h-screen px-8 md:px-24 py-8">
        {/* Horizontal Scrolling Container */}
        <div
          ref={targetRef}
          className="h-[300vh]  bg-neutral-900 relative w-fit"
        >
          {/* Custom Scrollbar Styling */}
          <div className="h-screen  sticky top-0 flex w-fit items-center overflow-hidden">
            <motion.div style={{ x }} className=" bg-amber-200 flex gap-8 pb-8">
              {projects.map((project, index) => (
                <div
                  key={index}
                  className="group relative flex-shrink-0 cursor-pointer"
                  style={{
                    width: "min(500px, 70vw)", // Responsive width
                    aspectRatio: "9/16", // Maintain 9:16 ratio
                  }}
                >
                  {/* Project Image */}
                  <div className="absolute inset-0 overflow-hidden rounded-lg">
                    <div
                      className="w-full h-full bg-cover bg-center transform transition-transform duration-700 group-hover:scale-110"
                      style={{ backgroundImage: `url(${project.image})` }}
                    />

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      {/* Vertical Text on Left */}
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 -rotate-90 origin-center">
                        <span className="text-white/60 tracking-widest text-sm">
                          VIEW PROJECT
                        </span>
                      </div>

                      {/* Category Text */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white font-bold text-2xl tracking-wider transform translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                          {project.category}
                        </span>
                      </div>

                      {/* Bottom Details */}
                      <div className="absolute bottom-4 right-4 text-right">
                        <h3 className="text-white text-lg font-medium transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                          {project.title}
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Scroll Indicators */}
          {/* <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {projects.map((_, index) => (
              <div
                key={index}
                className="w-16 h-1 bg-white/20 rounded-full overflow-hidden"
              >
                <div className="w-full h-full bg-white transform -translate-x-full animate-scroll-indicator" />
              </div>
            ))}
          </div> */}
        </div>
      </main>
      <div className="flex h-48 items-center justify-center">
        <span className="font-semibold uppercase text-neutral-500">
          Scroll up
        </span>
      </div>
    </div>
  );
}
