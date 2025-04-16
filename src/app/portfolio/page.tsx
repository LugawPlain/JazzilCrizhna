"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { HorizontalScrollCarousel } from "./components/HorizontalScrollCarousel";

const Portfolio = () => {
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 1000) {
        setShowScrollIndicator(false);
      } else {
        setShowScrollIndicator(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className=" bg-neutral-900"
    >
      <HorizontalScrollCarousel />
    </motion.div>
  );
};

export default Portfolio;
