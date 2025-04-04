"use client";
import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-neutral-900 py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold text-white mb-4">About Me</h1>
          <p className="text-gray-400">Get to know me better</p>
        </motion.div>

        <div className="relative mb-16">
          {/* Profile Picture */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative aspect-square rounded-lg overflow-hidden w-full md:w-3/4"
          >
            <Image
              src="/about/1.webp"
              alt="Profile Picture"
              fill
              className="object-cover"
              priority
            />
          </motion.div>

          {/* Biography */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="absolute top-1/2 right-0 -translate-y-1/2 w-full md:w-1/2 bg-neutral-800/80 backdrop-blur-sm p-8 rounded-lg"
          >
            <h2 className="text-4xl font-semibold mb-4 text-white">My Story</h2>
            <p className="text-gray-300 leading-relaxed">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Excepteur sint occaecat cupidatat non proident, sunt in culpa qui
              officia deserunt mollit anim id est laborum. Sed ut perspiciatis
              unde omnis iste natus error sit voluptatem accusantium doloremque
              laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore
              veritatis et quasi architecto beatae vitae dicta sunt explicabo.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit
              aut fugit, sed quia consequuntur magni dolores eos qui ratione
              voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem
              ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia
              non numquam eius modi tempora incidunt ut labore et dolore magnam
              aliquam quaerat voluptatem.
            </p>
          </motion.div>
        </div>

        {/* Body Measurements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-neutral-800 rounded-lg p-8 relative group"
        >
          <h2 className="text-2xl text-center font-semibold text-white mb-6">
            Body Measurements
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-gray-400 text-sm">Height</p>
              <p className="text-white text-xl font-medium blur-sm   group-hover:blur-[4px] transition-all">
                7'9"
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Weight</p>
              <p className="text-white text-xl font-medium blur-sm  group-hover:blur-xs transition-all">
                000 lbs
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Bust</p>
              <p className="text-white text-xl font-medium blur-sm  group-hover:blur-xs transition-all">
                90"
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Waist</p>
              <p className="text-white text-xl font-medium blur-sm group-hover:blur-xs transition-all">
                11"
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Hips</p>
              <p className="text-white text-xl font-medium blur-sm group-hover:blur-xs transition-all">
                250"
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Dress Size</p>
              <p className="text-white text-xl font-medium blur-sm group-hover:blur-xs transition-all">
                0.5
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Shoe Size</p>
              <p className="text-white text-xl font-medium blur-sm group-hover:blur-xs transition-all">
                0.15
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Hair Color</p>
              <p className="text-white text-xl font-medium blur-sm group-hover:blur-xs transition-all">
                Black
              </p>
            </div>
          </div>
          <Link href="/contact">
            <div className="absolute scale-50 group-hover:scale-100 inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
              <button className="bg-white text-neutral-900 px-8 py-3 rounded-full font-semibold hover:bg-neutral-200 transition-colors">
                Contact Us
              </button>
            </div>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
