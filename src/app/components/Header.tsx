"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { categories } from "../portfolio/CategoryData";
import Marquee from "react-fast-marquee";
import { motion, AnimatePresence } from "framer-motion";

export default function Header() {
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(true);

  useEffect(() => {
    // Initially show the announcement
    setShowAnnouncement(true);

    // Hide after 10 seconds
    const timer = setTimeout(() => {
      setShowAnnouncement(false);
    }, 20000);

    return () => clearTimeout(timer);
  }, []);

  // Don't render the header on the home page
  if (pathname === "/") {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 ">
      <AnimatePresence>
        {showAnnouncement && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.5 }}
            className="text-[13px] bg-gradient-to-r from-purple-700 via-pink-600 to-purple-700 text-white py-1 overflow-hidden"
          >
            <Marquee pauseOnHover speed={100}>
              <p>Website is still on Beta🥰, Developments are underway </p>
            </Marquee>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Announcement Marquee */}

      <nav className="bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo/Name */}
            <Link
              href="/"
              className="text-white text-3xl font-semibold hover:text-gray-200 transition-colors"
            >
              Yorticia
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {/* Portfolio Dropdown */}
              <div className="relative">
                <div
                  onMouseEnter={() => setIsDropdownOpen(true)}
                  onMouseLeave={() => setIsDropdownOpen(false)}
                  className="flex items-center pl-8"
                >
                  <Link
                    href="/portfolio"
                    className="text-white underline underline-offset-4 hover:text-gray-200 transition-colors flex items-center gap-2 py-2"
                  >
                    Portfolio
                    <span className="p-2">
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isDropdownOpen ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </span>
                  </Link>
                </div>

                {/* Dropdown Menu */}
                <div
                  onMouseEnter={() => setIsDropdownOpen(true)}
                  onMouseLeave={() => setIsDropdownOpen(false)}
                  className={`absolute right-0 w-48 rounded-lg shadow-lg bg-black/90 backdrop-blur-sm ring-1 ring-white/10 
                    transition-all duration-200 origin-top ${
                      isDropdownOpen
                        ? "opacity-100 scale-100 translate-y-0"
                        : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                    }`}
                >
                  <div className="py-2 px-1">
                    {categories.map((category) => (
                      <Link
                        key={category.title}
                        href={category.link}
                        className={`block px-4 py-2 text-sm text-white hover:bg-white/10 rounded-md transition-colors ${
                          pathname === category.link ? "bg-white/10" : ""
                        }`}
                      >
                        {category.title}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <Link
                href="/about"
                className={`text-white hover:text-gray-200 transition-colors ${
                  pathname === "/about" ? "text-gray-200" : ""
                }`}
              >
                About
              </Link>
              <Link
                href="/calendar"
                className={`text-white hover:text-gray-200 transition-colors ${
                  pathname === "/contact" ? "text-gray-200" : ""
                }`}
              >
                Calendar
              </Link>
              <Link
                href="/contact"
                className={`text-white hover:text-gray-200 transition-colors ${
                  pathname === "/contact" ? "text-gray-200" : ""
                }`}
              >
                Contact
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-white hover:text-gray-200 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 bg-black/90 backdrop-blur-sm transform will-change-transform transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full p-6">
          <div className="flex justify-end">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-red-500 hover:text-gray-200 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="flex flex-col space-y-6 mt-8">
            {/* Portfolio Dropdown */}
            <div className="relative">
              <div className="flex items-center">
                <Link
                  onClick={() => setIsMobileMenuOpen(false)}
                  href="/portfolio"
                  className="underline text-white underline-offset-4 hover:text-gray-200 transition-colors flex items-center gap-2 py-2 text-xl"
                >
                  Portfolio
                </Link>
                <span
                  className="p-4 pr-12 text-white "
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </span>
              </div>

              {/* Mobile Dropdown Menu */}
              <div
                className={`mt-2 space-y-2 overflow-hidden transition-all duration-300 ease-in-out ${
                  isDropdownOpen
                    ? "max-h-[500px] opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                {categories.map((category) => (
                  <Link
                    key={category.title}
                    href={category.link}
                    className={`block px-4 py-2 text-lg text-white hover:bg-white/10 rounded-md transition-colors transform ${
                      pathname === category.link ? "bg-white/10" : ""
                    } ${
                      isDropdownOpen
                        ? "translate-y-0 opacity-100"
                        : "-translate-y-4 opacity-0"
                    }`}
                    style={{
                      transitionDelay: `${categories.indexOf(category) * 50}ms`,
                    }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {category.title}
                  </Link>
                ))}
              </div>
            </div>

            <Link
              href="/about"
              className={`text-white hover:text-gray-200 transition-colors text-xl ${
                pathname === "/about" ? "text-gray-200" : ""
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/calendar"
              className={`text-white hover:text-gray-200 transition-colors text-xl ${
                pathname === "/calendar" ? "text-gray-200" : ""
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Calendar
            </Link>
            <Link
              href="/contact"
              className={`text-white hover:text-gray-200 transition-colors text-xl ${
                pathname === "/contact" ? "text-gray-200" : ""
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
