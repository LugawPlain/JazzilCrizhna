"use client";
import { motion } from "framer-motion";
import { HorizontalScrollCarousel } from "../../components/HorizontalScrollCarousel";

const Portfolio = () => {
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
