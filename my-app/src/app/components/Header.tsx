"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { categories } from "../portfolio/CategoryData";
export default function Header() {
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Don't render the header on the home page
  if (pathname === "/") {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
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
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="text-white hover:text-gray-200 transition-colors flex items-center gap-2 py-2"
                >
                  Portfolio
                  <span
                    onMouseEnter={() => setIsDropdownOpen(true)}
                    className="p-2"
                  >
                    <svg
                      className={`w-4 h-4  transition-transform duration-200 ${
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
                </button>

                {/* Dropdown Menu */}
                <div
                  onMouseLeave={() => setIsDropdownOpen(false)}
                  className={`absolute right-0 mt-1 w-48 rounded-lg shadow-lg bg-black/90 backdrop-blur-sm ring-1 ring-white/10 
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
            <button className="md:hidden text-white hover:text-gray-200 transition-colors">
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
    </header>
  );
}
