"use client";
import Link from "next/link";
import React from "react";
import { motion } from "framer-motion";

interface HerobuttonProps {
  text?: string;
}

const Herobutton: React.FC<HerobuttonProps> = ({ text = "Portfolio" }) => {
  return (
    <div className="relative flex items-center justify-center lg:opacity-40  lg:hover:opacity-100 transition-all duration-150">
      <motion.svg
        className="absolute z-0"
        width="200"
        height="100"
        viewBox="0 0 200 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={{
          scale: [0.95, 1, 0.95],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <path
          d="M0 50 L0 0 L100 0"
          stroke="white"
          strokeWidth="6"
          strokeLinecap="round"
          strokeOpacity="0.5"
          fill="none"
        />
        <path
          d="M200 50 L200 100 L100 100"
          stroke="white"
          strokeWidth="6"
          strokeLinecap="round"
          strokeOpacity="0.5"
          fill="none"
        />
      </motion.svg>

      <Link
        href="/portfolio"
        className="hover:bg-white/10 hover:backdrop-blur-xs transition-all duration-150 px-1 py-2 rounded-md z-10 group "
      >
        <p className="text-white group-hover:text-[#FFD700] transition-all duration-150 text-5xl font-normal font-aesthetic-moment  ">
          {text}
        </p>
      </Link>
    </div>
  );
};

export default Herobutton;
