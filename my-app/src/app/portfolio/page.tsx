"use client";
import { motion } from "framer-motion";
import React from "react";
import { HorizontalScrollCarousel } from "./components/HorizontalScrollCarousel";

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

export default Portfolio;
