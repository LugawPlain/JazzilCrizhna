"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Marquee from "react-fast-marquee";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";

interface CategoryLink {
  title: string;
  link: string;
}

export default function Header() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [categories, setCategories] = useState<CategoryLink[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [errorCategories, setErrorCategories] = useState<string | null>(null);

  useEffect(() => {
    // Initially show the announcement
    setShowAnnouncement(true);

    // Hide after 10 seconds
    const timer = setTimeout(() => {
      setShowAnnouncement(false);
    }, 20000);

    // Fetch categories
    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      setErrorCategories(null);
      try {
        const response = await fetch("/api/fetch-categories");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data && Array.isArray(data.categories)) {
          setCategories(data.categories);
        } else {
          console.warn(
            "Fetched categories data is not in expected format:",
            data
          );
          setCategories([]); // Set empty if format is wrong
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        setErrorCategories("Failed to load categories.");
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories(); // Call the fetch function

    return () => clearTimeout(timer); // Cleanup announcement timer
  }, []);

  // Add the useEffect hook to log only when session/status change
  useEffect(() => {
    // This will only run when the session or status changes
    // console.log("Session status changed:", status);
    // console.log("Session data:", session);
  }, [session, status]);

  // Effect to disable body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    // Cleanup function to reset overflow when component unmounts
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Don't render the header on the home page
  if (pathname === "/") {
    return null;
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 max-h-24 min-h-24">
        {/* <AnimatePresence>
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
        </AnimatePresence> */}
        {/* Announcement Marquee */}

        <nav className="bg-black/20 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo/Name */}
              <Link
                href="/"
                className="text-white text-3xl hover:text-gray-200 transition-color font-bold font-montserrat"
              >
                Yorticia
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-8 font-montserrat text-lg">
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
                      {isLoadingCategories ? (
                        <div className="px-4 py-2 text-sm text-gray-400">
                          Loading...
                        </div>
                      ) : errorCategories ? (
                        <div className="px-4 py-2 text-sm text-red-400">
                          {errorCategories}
                        </div>
                      ) : categories.length > 0 ? (
                        categories.map((category) => (
                          <Link
                            key={category.title}
                            href={category.link}
                            className={`block px-4 py-2 text-sm text-white hover:bg-white/10 rounded-md transition-colors ${
                              pathname === category.link ? "bg-white/10" : ""
                            }`}
                          >
                            {category.title}
                          </Link>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-sm text-gray-400">
                          No categories
                        </div>
                      )}
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

                {/* Admin Avatar Link to Login Page */}
                {status === "authenticated" &&
                  session.user?.role === "admin" &&
                  session.user.image && (
                    <Link href="/login" className="ml-4">
                      <Image
                        src={session.user.image}
                        alt={session.user.name || "Admin avatar"}
                        width={32} // Smaller size for header
                        height={32} // Smaller size for header
                        className="rounded-full hover:opacity-80 transition-opacity duration-200 cursor-pointer"
                        referrerPolicy="no-referrer" // Add this for external images
                      />
                    </Link>
                  )}
              </div>

              {/* Mobile Menu Button (visible only below md) */}
              <div className="md:hidden flex items-center">
                {/* Display admin icon on mobile as well if needed, or just the button */}
                {status === "authenticated" &&
                  session.user?.role === "admin" &&
                  session.user.image && (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || "Admin avatar"}
                      width={32}
                      height={32}
                      className="rounded-full mr-3" // Add margin
                      referrerPolicy="no-referrer"
                    />
                  )}
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="text-white hover:text-gray-200 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  aria-label="Open main menu"
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
                      d="M4 6h16M4 12h16m-7 6h7"
                    />
                  </svg>
                </button>
              </div>
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
                  {isLoadingCategories ? (
                    <div className="px-4 py-2 text-lg text-gray-400">
                      Loading...
                    </div>
                  ) : errorCategories ? (
                    <div className="px-4 py-2 text-lg text-red-400">
                      {errorCategories}
                    </div>
                  ) : categories.length > 0 ? (
                    categories.map((category) => (
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
                          transitionDelay: `${
                            categories.indexOf(category) * 50
                          }ms`,
                        }}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {category.title}
                      </Link>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-lg text-gray-400">
                      No categories
                    </div>
                  )}
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

              {/* Auth Buttons - Mobile */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                {status === "loading" ? (
                  <div className="text-white text-center">Loading...</div>
                ) : session ? (
                  <div className="flex flex-col items-center space-y-4">
                    {/* Conditionally display admin image */}
                    {session.user?.role === "admin" && session.user?.image && (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || "Admin avatar"}
                        width={40}
                        height={40}
                        className="rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    {/* Always display name if available */}
                    {session.user?.name && (
                      <span className="text-white text-lg">
                        {session.user.name}
                      </span>
                    )}
                    {/* Always show logout for logged-in users */}
                    <button
                      onClick={() => {
                        signOut();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-lg transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  // Show login button if not authenticated
                  <button
                    onClick={() => {
                      signIn("google");
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-lg transition-colors"
                  >
                    Login with Google
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      {/* <div className="h-24 bg-neutral-900"></div> */}
    </>
  );
}
