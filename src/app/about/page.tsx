"use client";
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-neutral-900 py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 sm:mb-16"
        >
          <h1 className="text-3xl sm:text-4xl  text-white mb-2 sm:mb-4 font-heebo font-semibold">
            About Me
          </h1>
          <p className="text-gray-400">Get to know me better 🥰</p>
        </motion.div>

        <div className="relative mb-8 sm:mb-16">
          {/* Profile Picture */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative aspect-square rounded-lg overflow-hidden w-full lg:w-3/4 h-full "
          >
            <img
              src="/about/About.webp"
              alt="Profile Picture"
              className="object-cover lg:scale-100 scale-120"
            />
            {/* <Image
              src="/about/about.webp"
              alt="Profile Picture"
              fill
              className="object-cover"
              priority
            />*/}
          </motion.div>
          {/* Biography */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6 lg:mt-0 lg:absolute lg:top-1/2 lg:right-0 lg:-translate-y-1/2 w-full lg:w-1/2 bg-neutral-800/80 backdrop-blur-sm p-4 sm:p-8 rounded-lg"
          >
            <h2 className="text-2xl sm:text-4xl text-center lg:text-left font-semibold mb-3 sm:mb-4 text-white">
              My Story
            </h2>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed antialiased tracking-wide">
              Hi there! ☺️ I'm
              <span className="font-bold text-lg text-amber-500">
                {" "}
                Jazzil Sarinas{" "}
              </span>{" "}
              (Yorticia) a model, an influencer, and a brand ambassador based on
              Cavite.
              <br />
              My journey ✈️ began with me participating on sagala festivals 🎉🎏
              and mall pageants 🏢👠, those early moments sparked a love for
              self expression confidence and grace 💗💖. What started as a
              heartfelt passion has blossomed into my purpose.
              <br /> Over the years, I’ve been so grateful for opportunities
              like being a basketball league muse 🏀, which gave me a platform
              not just to be seen, but to inspire, uplift, and share the story
              and energy ⚡🥰 I bring. Every runway walk, every photoshoot, and
              every collaboration has sculpted the person I am today, someone
              who leads with genuine authenticity and a whole lot of heart 💞.
              <br />
              Now, I thrive on collaborating with brands, photographers 📸, and
              fellow creatives 🎨 to craft content that’s more than just
              stylish, it’s meaningful. Whether it's bringing fashion 👘👗 to
              life, capturing a lifestyle moment, or energizing a live event, I
              pour my passion into every detail, always aiming to spark
              inspiration and leave a positive, lasting impression 💖💖.
              <br />
              Thanks for stopping by! 😁 I’m excited by the possibility of
              connecting and creating something truly beautiful together 💖💖
            </p>
          </motion.div>
        </div>

        {/* Body Measurements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-neutral-800 rounded-lg p-4 sm:p-8 relative group"
        >
          <h2 className="text-xl sm:text-2xl text-center font-semibold text-white mb-4 sm:mb-6">
            Body Measurements
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            <div className="text-center">
              <p className="text-gray-400 text-xs sm:text-sm">Height</p>
              <p className="text-white text-lg sm:text-xl font-medium blur-sm group-hover:blur-[4px] transition-all">
                7&apos;9&quot;
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs sm:text-sm">Weight</p>
              <p className="text-white text-lg sm:text-xl font-medium blur-sm group-hover:blur-xs transition-all">
                000 lbs
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs sm:text-sm">Bust</p>
              <p className="text-white text-lg sm:text-xl font-medium blur-sm group-hover:blur-xs transition-all">
                90&quot;
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs sm:text-sm">Waist</p>
              <p className="text-white text-lg sm:text-xl font-medium blur-sm group-hover:blur-xs transition-all">
                11&quot;
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs sm:text-sm">Hips</p>
              <p className="text-white text-lg sm:text-xl font-medium blur-sm group-hover:blur-xs transition-all">
                250&quot;
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs sm:text-sm">Dress Size</p>
              <p className="text-white text-lg sm:text-xl font-medium blur-sm group-hover:blur-xs transition-all">
                0.5
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs sm:text-sm">Shoe Size</p>
              <p className="text-white text-lg sm:text-xl font-medium blur-sm group-hover:blur-xs transition-all">
                0.15
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs sm:text-sm">Hair Color</p>
              <p className="text-white text-lg sm:text-xl font-medium blur-sm group-hover:blur-xs transition-all">
                Black
              </p>
            </div>
          </div>
          <Link href="/contact">
            <div className="absolute  lg:scale-50 group-hover:scale-100 inset-0 flex items-center justify-center lg:opacity-0 group-hover:opacity-100 transition-all">
              <button className="bg-white text-neutral-900 px-6 sm:px-8 py-2 sm:py-3 rounded-full text-sm sm:text-base font-semibold hover:bg-neutral-200 transition-colors">
                Contact Us
              </button>
            </div>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
