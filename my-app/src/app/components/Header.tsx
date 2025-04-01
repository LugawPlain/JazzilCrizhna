"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  // Don't render the header on the home page
  if (pathname === "/") {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-sm">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-center relative">
          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-12">
            <Link
              href="/portfolio"
              className="text-white hover:text-gray-200 transition-colors"
            >
              Portfolio
            </Link>
            <Link
              href="/about"
              className="text-white hover:text-gray-200 transition-colors"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-white hover:text-gray-200 transition-colors"
            >
              Contact
            </Link>
          </div>

          {/* Logo/Name - Absolute positioned */}
          <Link
            href="/"
            className="absolute left-0 text-white text-xl font-semibold hover:text-gray-200 transition-colors"
          >
            Yorticia
          </Link>

          {/* Mobile Menu Button - Absolute positioned */}
          <button className="absolute right-0 md:hidden text-white hover:text-gray-200 transition-colors">
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
      </nav>
    </header>
  );
}
